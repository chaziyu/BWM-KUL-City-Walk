// File: /api/chat.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { GENERAL_KNOWLEDGE } = require('../general_knowledge.js'); // 1. Import general info


/**
 * Reads the master data.json file and builds a context string
 * containing only the site-specific AI knowledge.
 */
function buildSiteContext() {
    try {
        // Resolve the path to data.json in the root directory
        // Use require to ensure Vercel bundles the file
        const sites = require('../data.json');

        let siteContext = "\n--- HERITAGE SITES ---";
        
        // Loop through all sites and add their ai_context
        for (const site of sites) {
            // Use the "ai_context" field if it exists, otherwise fallback to "info"
            const context = site.ai_context || site.info;
            if (context) {
                siteContext += `\n\n### ${site.name} (ID: ${site.id})\n${context}`;
            }
        }
        return siteContext;

    } catch (error) {
        console.error('Error reading data.json for AI context:', error);
        // Return a minimal context string on error
        return "\n--- HERITAGE SITES ---\nError: Could not load site data.\n";
    }
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
        const siteContext = buildSiteContext();
        // We prepend GENERAL_KNOWLEDGE to add the persona, rules, and history
        const finalContext = GENERAL_KNOWLEDGE + siteContext;

        // The system prompt now just injects the combined context
        const systemPrompt = `
${finalContext}
--- END CONTEXT ---`;

        const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY);
        
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash-lite", // Using your original model name
            systemInstruction: systemPrompt,
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
