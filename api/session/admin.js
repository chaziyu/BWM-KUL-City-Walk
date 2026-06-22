const {
    createSessionPayload,
    getSafeSessionDetails,
    setSessionCookie
} = require('../_session');

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { password } = request.body || {};
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (!correctPassword) {
            return response.status(500).json({ error: 'Server misconfigured: admin password missing.' });
        }

        if (!password || password !== correctPassword) {
            return response.status(401).json({ error: 'Invalid admin password.' });
        }

        const maxAge = Number(process.env.ADMIN_SESSION_MAX_AGE) || 60 * 60;
        const session = createSessionPayload('admin', {
            accessType: 'project-admin-prototype',
            maxAge
        });

        setSessionCookie(response, session, maxAge);
        return response.status(200).json(getSafeSessionDetails(session));
    } catch (error) {
        console.error('Error creating admin session:', error);
        return response.status(500).json({ error: 'Unable to create admin session.' });
    }
};
