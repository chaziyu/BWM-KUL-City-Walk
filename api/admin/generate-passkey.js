const { requireRole } = require('../_shared/session');

function getTodayString() {
    return new Date().toLocaleDateString('en-GB', {
        timeZone: 'Asia/Kuala_Lumpur'
    });
}

async function getTodayCodeFromSheet() {
    const sheetUrl = process.env.GOOGLE_SHEET_URL;
    if (!sheetUrl) return null;

    const sheetResponse = await fetch(sheetUrl);
    if (!sheetResponse.ok) return null;

    const data = await sheetResponse.text();
    const rows = data.split('\n');
    const todayStr = getTodayString();

    for (let i = 1; i < rows.length; i++) {
        const cols = rows[i].split(',');
        if (cols.length >= 2 && cols[0].trim() === todayStr) {
            return cols[1].trim();
        }
    }

    return null;
}

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const session = requireRole(request, ['admin']);
    if (!session) {
        return response.status(401).json({ error: 'Admin session required.' });
    }

    try {
        const scriptUrl = process.env.GOOGLE_SCRIPT_URL;
        const adminPassword = process.env.ADMIN_PASSWORD;
        let generatedCode = null;

        if (scriptUrl && adminPassword) {
            const genResponse = await fetch(scriptUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain;charset=utf-8' },
                body: JSON.stringify({
                    action: 'generate',
                    passkey: adminPassword,
                    deviceId: 'ADMIN_DEVICE'
                })
            });

            if (!genResponse.ok) {
                return response.status(502).json({ error: 'Passkey service did not respond.' });
            }

            const genResult = await genResponse.json();
            if (!genResult.success) {
                return response.status(502).json({ error: genResult.error || 'Passkey generation failed.' });
            }
            generatedCode = genResult.code || genResult.passkey;
        } else {
            generatedCode = await getTodayCodeFromSheet();
        }

        if (!generatedCode) {
            return response.status(500).json({ error: 'Passkey generation service is not configured.' });
        }

        return response.status(200).json({
            success: true,
            passkey: generatedCode,
            date: getTodayString()
        });
    } catch (error) {
        console.error('Error generating passkey:', error);
        return response.status(500).json({ error: 'Server error during passkey generation.' });
    }
};
