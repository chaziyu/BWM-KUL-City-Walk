const { readString } = require('../_shared/config');
const { requireMethod, sendError } = require('../_shared/http');
const { attachRequestContext, logEvent, sanitizeLogValue } = require('../_shared/observability');
const { requireSameOrigin } = require('../_shared/security');
const { requireRole } = require('../_shared/session');

function getTodayString() {
    return new Date().toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur',
    });
}

module.exports = async (request, response) => {
    const requestId = attachRequestContext(request, response);
    if (!requireMethod(request, response, 'POST')) return;
    if (!requireSameOrigin(request, response)) return;

    const session = requireRole(request, ['admin']);
    if (!session) {
        return sendError(response, 401, 'AUTH_REQUIRED', 'Admin session required.');
    }

    try {
        const scriptUrl = readString('GOOGLE_SCRIPT_URL');
        const adminPassword = readString('ADMIN_PASSWORD');
        if (!scriptUrl || !adminPassword) {
            return sendError(
                response,
                500,
                'SERVER_MISCONFIGURED',
                'Passkey generation service is not configured.',
            );
        }

        const genResponse = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: 'generate',
                passkey: adminPassword,
                deviceId: 'ADMIN_DEVICE',
            }),
        });

        if (!genResponse.ok) {
            return sendError(response, 502, 'PASSKEY_SERVICE_UNAVAILABLE', 'Passkey service did not respond.');
        }

        const genResult = await genResponse.json();
        if (!genResult.success) {
            return sendError(
                response,
                502,
                'PASSKEY_GENERATION_FAILED',
                genResult.error || 'Passkey generation failed.',
            );
        }

        const generatedCode = genResult.code || genResult.passkey;
        if (!generatedCode) {
            return sendError(response, 502, 'PASSKEY_GENERATION_FAILED', 'Passkey service returned no code.');
        }

        logEvent('info', 'admin:passkey-generated', {
            requestId,
            date: getTodayString(),
        });

        return response.status(200).json({
            success: true,
            passkey: generatedCode,
            date: getTodayString(),
        });
    } catch (error) {
        logEvent('error', 'admin:passkey-generation-failed', {
            requestId,
            message: sanitizeLogValue(error.message || error),
        });
        return sendError(response, 500, 'PASSKEY_GENERATION_FAILED', 'Server error during passkey generation.');
    }
};
