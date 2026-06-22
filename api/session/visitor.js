const {
    createSessionPayload,
    getSafeSessionDetails,
    setSessionCookie
} = require('../_shared/session');
const { isRateLimited } = require('../_shared/rate-limit');

function getTodayString() {
    return new Date().toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur'
    });
}

function isValidPasskeyFormat(passkey) {
    return /^[A-Z0-9-]{4,40}$/.test(passkey);
}

async function validateWithAppsScript(passkey, deviceId) {
    const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
    if (!scriptUrl) return null;

    const scriptResponse = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ passkey, deviceId })
    });

    if (!scriptResponse.ok) {
        return { success: false, error: 'Could not validate passkey.' };
    }

    return scriptResponse.json();
}

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { passkey, deviceId } = request.body || {};
        const normalizedPasskey = String(passkey || '').trim().toUpperCase();

        if (!normalizedPasskey) {
            return response.status(400).json({ error: 'Passkey required.' });
        }

        if (!isValidPasskeyFormat(normalizedPasskey)) {
            return response.status(400).json({ error: 'Passkey format is invalid.' });
        }

        const forwardedFor = request.headers['x-forwarded-for'];
        const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor || request.socket?.remoteAddress || 'unknown');
        
        // Rate limit: Max 10 attempts per IP per 10 minutes
        const isLimited = await isRateLimited(`login:visitor:${ip}`, 10, 10 * 60 * 1000);
        if (isLimited) {
            return response.status(429).json({ error: 'Too many attempts. Please try again later.' });
        }

        const validation = await validateWithAppsScript(normalizedPasskey, deviceId);

        if (!validation?.success || validation?.isAdmin) {
            return response.status(401).json({ error: validation?.error || 'Invalid or expired passkey.' });
        }

        const maxAge = Number(process.env.VISITOR_SESSION_MAX_AGE) || 24 * 60 * 60;
        const session = createSessionPayload('visitor', {
            accessType: 'visitor-passkey',
            maxAge
        });

        setSessionCookie(response, session, maxAge);
        return response.status(200).json(getSafeSessionDetails(session));
    } catch (error) {
        console.error('Error creating visitor session:', error);
        return response.status(500).json({ error: 'Server error during passkey validation.' });
    }
};
