// File: /api/get-admin-code.js

// --- THIS FUNCTION IS NOW FIXED ---
function getTodayString() {
    const now = new Date();
    // Get the date string for the 'Asia/Kuala_Lumpur' timezone
    // The 'en-CA' (Canadian English) locale formats the date as YYYY-MM-DD.
    const todayStr = now.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kuala_Lumpur'
    });
    return todayStr;
}
// --- END OF FIX ---

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
        const todayStr = getTodayString(); // This will now be "2025-11-18"
        let todayCode = "NOT FOUND";

        for (let i = 1; i < rows.length; i++) {
            const cols = rows[i].split(',');
            if (cols.length >= 2 && cols[0].trim() === todayStr) {
                todayCode = cols[1].trim();
                break;
            }
        }
        
        return response.status(200).json({ success: true, passkey: todayCode, date: todayStr });

    } catch (error) {
        console.error("Error in /api/get-admin-code:", error.message);
        return response.status(500).json({ error: 'Server error during passkey fetch.' });
    }
}
