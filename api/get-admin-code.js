// File: /api/get-admin-code.js

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
        
        // 1. Check the password against the *secret* Environment Variable
        if (password !== process.env.ADMIN_PASSWORD) {
            return response.status(401).json({ error: 'Wrong password' });
        }

        // 2. If password is correct, fetch the Google Sheet
        const SHEET_URL = process.env.GOOGLE_SHEET_URL;
        const sheetResponse = await fetch(SHEET_URL);
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
        
        // 3. Return the code to the admin
        return response.status(200).json({ success: true, passkey: todayCode, date: todayStr });

    } catch (error) {
        return response.status(500).json({ error: 'Server error' });
    }
}
