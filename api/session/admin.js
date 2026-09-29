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

module.exports = async (request, response) => {
    const requestId = attachRequestContext(request, response);
    if (!requireMethod(request, response, 'POST')) return;
    if (!requireSameOrigin(request, response)) return;

    try {
        const { password } = request.body || {};
        const correctPassword = readString('ADMIN_PASSWORD');
        const ip = getClientIp(request);

        if (await isRateLimited(`login:admin:${ip}`, 5, 10 * 60 * 1000)) {
            return sendError(response, 429, 'RATE_LIMITED', 'Too many attempts. Please try again later.');
        }

        if (!correctPassword) {
            return sendError(response, 500, 'SERVER_MISCONFIGURED', 'Server misconfigured: admin password missing.');
        }

        if (!password || password !== correctPassword) {
            return sendError(response, 401, 'INVALID_ADMIN_PASSWORD', 'Invalid admin password.');
        }

        const maxAge = readInteger('ADMIN_SESSION_MAX_AGE', 60 * 60, { min: 60 });
        const session = createSessionPayload('admin', {
            accessType: 'project-admin-prototype',
            maxAge,
            quotaSubject: createQuotaSubject('project-admin'),
        });

        setSessionCookie(response, session, maxAge);
        return response.status(200).json(getSafeSessionDetails(session));
    } catch (error) {
        logEvent('error', 'session:admin-create-failed', {
            requestId,
            message: sanitizeLogValue(error.message || error),
        });
        return sendError(response, 500, 'SESSION_CREATE_FAILED', 'Unable to create admin session.');
    }
};
