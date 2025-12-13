// File: /api/chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GENERAL_KNOWLEDGE } = require('../general_knowledge.js'); // 1. Import general info


// --- OPTIMIZATION: GLOBAL CONTEXT CACHING ---
// Variables declared here are cached across serverless invocations (Warm Start)
let FINAL_SYSTEM_PROMPT = "";

try {
    const sites = require('../data.json');
    let siteContext = "\n--- HERITAGE SITES ---";

    for (const site of sites) {
        const context = site.ai_context || site.info;
        if (context) {
            siteContext += `\n\n### ${site.name} (ID: ${site.id})\n${context}`;
        }
    }

    // Combine immediately at startup
    FINAL_SYSTEM_PROMPT = `
${GENERAL_KNOWLEDGE}${siteContext}
--- END CONTEXT ---`;

} catch (error) {
    console.error('Error preloading data.json (Cold Start):', error);
    FINAL_SYSTEM_PROMPT = "Error: Could not load site data. Please contact admin.";
}

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        // Use the original GOOGLE_API_KEY from your Vercel env
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            return response.status(500).json({ reply: "Server configuration error: API key is missing." });
        }

        const { userQuery, history } = request.body;

        // 3. Dynamically combine general knowledge + site knowledge
        // OPTIMIZED: Use cached global context

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite", // Using your original model name
            systemInstruction: FINAL_SYSTEM_PROMPT,
        });

        const chat = model.startChat({ history: history || [] });
        const result = await chat.sendMessage(userQuery);
        const aiResponse = result.response;
        const text = aiResponse.text();

        return response.status(200).json({ reply: text });

    } catch (error) {
        console.error('Error in Google chat handler:', error);
        return response.status(500).json({ reply: 'An error occurred on the server while communicating with the AI.' });
    }
};
