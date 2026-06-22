const {
    createSessionPayload,
    getSafeSessionDetails,
    setSessionCookie
} = require('../_shared/session');

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const maxAge = Number(process.env.DEMO_SESSION_MAX_AGE) || 2 * 60 * 60;
        const session = createSessionPayload('demo', {
            accessType: 'portfolio-demo',
            maxAge
        });

        setSessionCookie(response, session, maxAge);
        return response.status(200).json(getSafeSessionDetails(session));
    } catch (error) {
        console.error('Error creating demo session:', error);
        return response.status(500).json({ error: 'Unable to create demo session.' });
    }
};
