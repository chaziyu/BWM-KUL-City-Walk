// This accesses the global token set by get-admin-code.js.
// Read the notes in that file about the limitations of this approach for production scaling.
let tempAdminToken = global._tempAdminToken;

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
        const authHeader = request.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return response.status(401).json({ error: 'Authorization token required' });
        }
        const clientToken = authHeader.split(' ')[1];

        // Re-link to the global object in case this is a cold start
        if (!tempAdminToken) {
            tempAdminToken = global._tempAdminToken;
        }

        if (!tempAdminToken || !tempAdminToken.token || clientToken !== tempAdminToken.token) {
            return response.status(401).json({ error: 'Invalid or used token' });
        }
        if (Date.now() > tempAdminToken.expiry) {
            return response.status(401).json({ error: 'Token expired' });
        }
        
        const SHEET_URL = process.env.GOOGLE_SHEET_URL;
        if (!SHEET_URL) {
            return response.status(500).json({ error: 'Server misconfigured: Sheet URL missing' });
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
        
        // Invalidate the token after use
        tempAdminToken.token = null; 
        
        return response.status(200).json({ success: true, passkey: todayCode, date: todayStr });

    } catch (error) {
        console.error("Error in /api/fetch-todays-code:", error.message);
        return response.status(500).json({ error: 'Server error' });
    }
}
