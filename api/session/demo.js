const { readInteger } = require('../_shared/config');
const { requireMethod, sendError } = require('../_shared/http');
const { attachRequestContext, logEvent, sanitizeLogValue } = require('../_shared/observability');
const { requireSameOrigin } = require('../_shared/security');
const {
    createSessionPayload,
    getSafeSessionDetails,
    setSessionCookie,
} = require('../_shared/session');

module.exports = async (request, response) => {
    const requestId = attachRequestContext(request, response);
    if (!requireMethod(request, response, 'POST')) return;
    if (!requireSameOrigin(request, response)) return;

    try {
        const maxAge = readInteger('DEMO_SESSION_MAX_AGE', 2 * 60 * 60, { min: 60 });
        const session = createSessionPayload('demo', {
            accessType: 'portfolio-demo',
            maxAge,
        });

        setSessionCookie(response, session, maxAge);
        return response.status(200).json(getSafeSessionDetails(session));
    } catch (error) {
        logEvent('error', 'session:demo-create-failed', {
            requestId,
            message: sanitizeLogValue(error.message || error),
        });
        return sendError(response, 500, 'SESSION_CREATE_FAILED', 'Unable to create demo session.');
    }
};
