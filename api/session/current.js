const { requireMethod } = require('../_shared/http');
const { attachRequestContext, logEvent, sanitizeLogValue } = require('../_shared/observability');
const { getQuotaRemaining } = require('../_shared/rate-limit');
const { getQuotaKey } = require('../_shared/chat-quota');
const {
    ROLE_LIMITS,
    clearSessionCookie,
    getSafeSessionDetails,
    getSessionFromRequest,
} = require('../_shared/session');

module.exports = async (request, response) => {
    const requestId = attachRequestContext(request, response);
    if (!requireMethod(request, response, 'GET')) return;

    try {
        const session = getSessionFromRequest(request);
        if (!session) {
            clearSessionCookie(response);
            return response.status(200).json(getSafeSessionDetails(null));
        }

        const details = getSafeSessionDetails(session);
        details.remainingQuota = await getQuotaRemaining(
            getQuotaKey(session),
            ROLE_LIMITS[session.role] || 0,
        );
        return response.status(200).json(details);
    } catch (error) {
        logEvent('error', 'session:read-failed', {
            requestId,
            message: sanitizeLogValue(error.message || error),
        });
        clearSessionCookie(response);
        return response.status(200).json(getSafeSessionDetails(null));
    }
};
