const {
    ROLE_LIMITS,
    clearSessionCookie,
    getSafeSessionDetails,
    getSessionFromRequest
} = require('../_shared/session');
const { getQuotaRemaining } = require('../_shared/rate-limit');
const { getQuotaKey } = require('../_shared/chat-quota');

module.exports = async (request, response) => {
    if (request.method !== 'GET') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const session = getSessionFromRequest(request);
        if (!session) {
            clearSessionCookie(response);
            return response.status(200).json(getSafeSessionDetails(null));
        }

        const details = getSafeSessionDetails(session);
        details.remainingQuota = await getQuotaRemaining(
            getQuotaKey(session),
            ROLE_LIMITS[session.role] || 0
        );
        return response.status(200).json(details);
    } catch (error) {
        console.error('Error reading session:', error);
        clearSessionCookie(response);
        return response.status(200).json(getSafeSessionDetails(null));
    }
};
