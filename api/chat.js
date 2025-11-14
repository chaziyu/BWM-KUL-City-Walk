// This is NOT client-side code. This runs on Vercel's servers.
export default async function handler(request, response) {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    const { userQuery, context } = request.body;
    const GEMINI_API_KEY = process.env.MY_GEMINI_KEY; // <-- Your secret key
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    const systemPrompt = `You are 'Jejak Warisan AI', a helpful and friendly tour guide for the Kuala Lumpur heritage walk.
    Your knowledge is STRICTLY LIMITED to the document provided.
    Answer the user's question based ONLY on the following text.
    Do not use any outside knowledge. If the answer is not in the text, say "I'm sorry, that information is not in the BWM document."

    --- DOCUMENT START ---
    ${context}
    --- DOCUMENT END ---
    `;

    try {
        const apiResponse = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: systemPrompt + "\n\nUser Question: " + userQuery }]
                    }
                ],
                safetySettings: [
                    { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_ONLY_HIGH" },
                    { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_ONLY_HIGH" },
                ]
            })
        });

        // --- START OF NEW DEBUGGING CODE ---

        // Check if the API request itself was successful (e.g., not a 400 or 500 error)
        if (!apiResponse.ok) {
            const errorText = await apiResponse.text();
            console.error('Gemini API Error:', apiResponse.status, errorText);
            // Send a user-friendly error back to the app
            return response.status(500).json({ reply: 'Sorry, the AI guide is having trouble connecting. The API returned an error.' });
        }

        const data = await apiResponse.json();

        // Log the entire response from Google to see its structure
        console.log('Full Gemini API Response:', JSON.stringify(data, null, 2));

        // Check if the 'candidates' array is missing or empty
        if (!data.candidates || data.candidates.length === 0) {
            console.error('API returned no candidates. This could be due to safety filters or an invalid request.');
             // Check for a specific error message within the response
            if (data.promptFeedback && data.promptFeedback.blockReason) {
                 console.error('Prompt blocked. Reason:', data.promptFeedback.blockReason);
                 return response.status(200).json({ reply: 'My apologies, your request could not be processed due to the safety filter. Please rephrase your question.' });
            }
            return response.status(500).json({ reply: 'Sorry, the AI guide did not provide a valid response.' });
        }
        
        // --- END OF NEW DEBUGGING CODE ---

        // Send the AI's clean text response back to your app
        const aiResponse = data.candidates[0].content.parts[0].text;
        response.status(200).json({ reply: aiResponse });

    } catch (error) {
        console.error('Error in chat handler:', error);
        response.status(500).json({ error: 'Failed to fetch from Gemini API' });
    }
}
