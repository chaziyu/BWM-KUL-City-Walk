const { clearSessionCookie } = require('../_shared/session');

const { enforceSameOrigin } = require('../_shared/request-security');

module.exports = async (request, response) => {
    if (!enforceSameOrigin(request, response)) return;
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    clearSessionCookie(response);
    return response.status(200).json({ success: true, role: 'guest' });
};
