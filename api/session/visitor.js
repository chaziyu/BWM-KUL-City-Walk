const {
    createSessionPayload,
    getSafeSessionDetails,
    setSessionCookie
} = require('../_session');

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

async function validateWithPublishedSheet(passkey) {
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) {
        return { success: false, error: 'Server misconfigured: passkey validation missing.' };
    }

    const sheetResponse = await fetch(sheetUrl);
    if (!sheetResponse.ok) {
        return { success: false, error: 'Could not connect to passkey sheet.' };
    }

    const data = await sheetResponse.text();
    const rows = data.split('\n');
    const todayStr = getTodayString();
    let validCode = null;

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',');
        if (cols.length >= 2 && cols[0].trim() === todayStr) {
            validCode = cols[1].trim();
            break;
        }
    }

    return {
        success: Boolean(validCode && passkey === validCode.trim().toUpperCase()),
        error: 'Invalid or expired passkey.'
    };
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

        const validation = await validateWithAppsScript(normalizedPasskey, deviceId)
            || await validateWithPublishedSheet(normalizedPasskey);

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
