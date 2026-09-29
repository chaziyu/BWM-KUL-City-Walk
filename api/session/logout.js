const { requireMethod } = require('../_shared/http');
const { attachRequestContext } = require('../_shared/observability');
const { requireSameOrigin } = require('../_shared/security');
const { clearSessionCookie } = require('../_shared/session');

module.exports = async (request, response) => {
    attachRequestContext(request, response);
    if (!requireMethod(request, response, 'POST')) return;
    if (!requireSameOrigin(request, response)) return;

    clearSessionCookie(response);
    return response.status(200).json({ success: true, role: 'guest' });
};
