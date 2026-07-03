const { requireRole } = require('../_shared/session');
const { fetchJsonWithTimeout } = require('../_shared/http');

function getTodayString() {
    return new Date().toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur'
    });
}

const { enforceSameOrigin } = require('../_shared/request-security');

module.exports = async (request, response) => {
    if (!enforceSameOrigin(request, response)) return;
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const session = requireRole(request, ['admin']);
    if (!session) {
        return response.status(401).json({ error: 'Admin session required.' });
    }

    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        let generatedCode = null;

        if (scriptUrl && adminPassword) {
            const genResult = await fetchJsonWithTimeout(scriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'generate',
                    passkey: adminPassword,
                    deviceId: 'ADMIN_DEVICE'
                })
            }, 8000);

            if (!genResult?.success) {
                return response.status(502).json({ error: genResult?.error || 'Passkey generation failed.' });
            }
            generatedCode = genResult.code || genResult.passkey;
        }

        if (!generatedCode) {
            return response.status(500).json({ error: 'Passkey generation service is not configured.' });
        }

        console.info(`[AUDIT] Admin generated a passkey on ${getTodayString()}`);

        return response.status(200).json({
            success: true,
            passkey: generatedCode,
            date: getTodayString()
        });
    } catch (error) {
        console.error('Error generating passkey:', error.message || error);
        if (error.status === 504) {
            return response.status(504).json({ error: 'Service took too long; please retry' });
        }
        if (error.status === 502) {
            return response.status(502).json({ error: 'Service could not complete the request' });
        }
        return response.status(500).json({ error: 'Server error during passkey generation.' });
    }
};
