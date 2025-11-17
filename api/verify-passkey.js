// File: /api/verify-passkey.js
// --- THIS IS A TEMPORARY DEBUGGING FILE ---

export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // We are not checking the passkey. We are just
        // logging that the request was received and sending success.
        const { passkey } = request.body;
        console.log(`DEBUG: Received passkey ${passkey}. Sending success.`);

        // Immediately return success
        return response.status(200).json({ success: true, message: 'Passkey valid (DEBUG)' });

    } catch (error) {
        console.error('DEBUG Error:', error);
        return response.status(500).json({ error: 'Server error' });
    }
}
