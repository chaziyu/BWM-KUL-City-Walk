const { readInteger, readString } = require('../_shared/config');
const { getClientIp, requireMethod, sendError } = require('../_shared/http');
const { attachRequestContext, logEvent, sanitizeLogValue } = require('../_shared/observability');
const { isRateLimited } = require('../_shared/rate-limit');
const { requireSameOrigin } = require('../_shared/security');
const {
    createQuotaSubject,
    createSessionPayload,
    getSafeSessionDetails,
    setSessionCookie,
} = require('../_shared/session');

function isValidPasskeyFormat(passkey) {
    return /^[A-Z0-9-]{4,40}$/.test(passkey);
}

async function validateWithAppsScript(passkey, deviceId) {
    const scriptUrl = readString('GOOGLE_SCRIPT_URL');
    if (!scriptUrl) {
        return { serviceError: true, error: 'Visitor validation service is not configured.' };
    }

    const scriptResponse = await fetch(scriptUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ passkey, deviceId }),
    });

    if (!scriptResponse.ok) {
        return { serviceError: true, error: 'Visitor validation service is unavailable.' };
    }

    return scriptResponse.json();
}

module.exports = async (request, response) => {
    const requestId = attachRequestContext(request, response);
    if (!requireMethod(request, response, 'POST')) return;
    if (!requireSameOrigin(request, response)) return;

    try {
        const { passkey, deviceId } = request.body || {};
        const normalizedPasskey = String(passkey || '').trim().toUpperCase();

        if (!normalizedPasskey) {
            return sendError(response, 400, 'PASSKEY_REQUIRED', 'Passkey required.');
        }

        if (!isValidPasskeyFormat(normalizedPasskey)) {
            return sendError(response, 400, 'INVALID_PASSKEY_FORMAT', 'Passkey format is invalid.');
        }

        if (await isRateLimited(`login:visitor:${getClientIp(request)}`, 10, 10 * 60 * 1000)) {
            return sendError(response, 429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
        }

        const validation = await validateWithAppsScript(normalizedPasskey, deviceId);

        if (validation?.serviceError) {
            return sendError(response, 503, 'VISITOR_SERVICE_UNAVAILABLE', validation.error);
        }

        if (!validation?.success || validation?.isAdmin) {
            return sendError(
                response,
                401,
                'INVALID_PASSKEY',
                validation?.error || 'Invalid or expired passkey.',
            );
        }

        const maxAge = readInteger('VISITOR_SESSION_MAX_AGE', 24 * 60 * 60, { min: 60 });
        const session = createSessionPayload('visitor', {
            accessType: 'visitor-passkey',
            maxAge,
            quotaSubject: createQuotaSubject(
                `visitor:${normalizedPasskey}:${String(deviceId || '')}`,
            ),
        });

        setSessionCookie(response, session, maxAge);
        return response.status(200).json(getSafeSessionDetails(session));
    } catch (error) {
        logEvent('error', 'session:visitor-create-failed', {
            requestId,
            message: sanitizeLogValue(error.message || error),
        });
        return sendError(response, 500, 'SESSION_CREATE_FAILED', 'Server error during passkey validation.');
    }
};
