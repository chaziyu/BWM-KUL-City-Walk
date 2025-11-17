import crypto from 'crypto';

// This is a simplified in-memory store for the token.
// It will not work across multiple serverless instances. For production, use Vercel KV or another shared DB.
let tempAdminToken = {
    token: null,
    expiry: null,
};

// This is a trick to allow the other API route to access the same in-memory token.
// Vercel may run each API route in a separate process, so this is NOT guaranteed.
// A real database (Vercel KV, Redis) is the robust solution.
global._tempAdminToken = tempAdminToken;


export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { password } = request.body;
        const correctPassword = process.env.ADMIN_PASSWORD;

        if (!correctPassword) {
             return response.status(500).json({ error: 'Server misconfigured: Admin password not set.' });
        }
        
        if (password !== correctPassword) {
            return response.status(401).json({ error: 'Wrong password' });
        }

        const token = crypto.randomBytes(32).toString('hex');
        
        // Store the token with a 5-minute expiry
        global._tempAdminToken.token = token;
        global._tempAdminToken.expiry = Date.now() + 5 * 60 * 1000;

        return response.status(200).json({ success: true, token: token });

    } catch (error) {
        console.error("Error in /api/get-admin-code:", error.message);
        return response.status(500).json({ error: 'Server error during authentication.' });
    }
}
