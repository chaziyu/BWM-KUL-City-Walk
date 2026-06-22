const {
    clearSessionCookie,
    getSafeSessionDetails,
    getSessionFromRequest
} = require('../_session');

module.exports = async (request, response) => {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const session = getSessionFromRequest(request);
        if (!session) clearSessionCookie(response);
        return response.status(200).json(getSafeSessionDetails(session));
    } catch (error) {
        console.error('Error reading session:', error);
        clearSessionCookie(response);
        return response.status(200).json(getSafeSessionDetails(null));
    }
};
