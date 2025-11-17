// File: /api/get-admin-code.js
// Simplified, single-call secure version.

function getTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

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

        // If password is correct, fetch the Google Sheet directly.
        const SHEET_URL = process.env.GOOGLE_SHEET_URL;
        if (!SHEET_URL) {
            return response.status(500).json({ error: 'Server error: Sheet URL missing' });
        }
        
        const sheetResponse = await fetch(SHEET_URL);
        if (!sheetResponse.ok) {
            return response.status(500).json({ error: 'Failed to fetch Google Sheet' });
        }
        
        const data = await sheetResponse.text();
        const rows = data.split('\n');
        const todayStr = getTodayString();
        let todayCode = "NOT FOUND";

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length >= 2 && cols[0].trim() === todayStr) {
                todayCode = cols[1].trim();
                break;
            }
        }
        
        // Return the code directly to the authenticated admin.
        return response.status(200).json({ success: true, passkey: todayCode, date: todayStr });

    } catch (error) {
        console.error("Error in /api/get-admin-code:", error.message);
        return response.status(500).json({ error: 'Server error during passkey fetch.' });
    }
}
