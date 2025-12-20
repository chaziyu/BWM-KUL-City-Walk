// File: /api/chat.js
const { GoogleGenAI } = require("@google/genai");
const path = require('path');
const fs = require('fs');

const { GENERAL_KNOWLEDGE } = require('../general_knowledge.js');

// --- CONTEXT ENGINEERING LAYER: SANITIZATION ---
function sanitizeText(str) {
    if (!str) return '';
    return str.normalize('NFC')
        .replace(/[\x00-\x1F\x7F]/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}

// --- OPTIMIZATION: GLOBAL CONTEXT CACHING ---
let FINAL_SYSTEM_PROMPT = "";
try {
    const jsonPath = path.join(process.cwd(), 'data.json');
    const sites = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    // STRUCTURED CONTEXT (Sandwich Strategy)
    let siteContext = "\n<knowledge_base_sites>";

    for (const site of sites) {
        const rawContext = site.ai_context || site.info;
        const cleanContext = sanitizeText(rawContext);

        if (cleanContext) {
            siteContext += `\n<site id="${site.id}" name="${site.name}">\n${cleanContext}\n</site>`;
        }
    }
    siteContext += "\n</knowledge_base_sites>";

    FINAL_SYSTEM_PROMPT = `
<system_identity>
${sanitizeText(GENERAL_KNOWLEDGE)}
</system_identity>

${siteContext}

<instructions>
You are an expert heritage guide. Answer based strictly on the <knowledge_base_sites>.
Tone: Engaging, professional, and knowledgeable.
Formatting:
1. Use clear Markdown formatting.
2. Use multiple short paragraphs for readability. Do NOT send one long block of text.
3. Use bullet points for lists (e.g., features, tips, or facts).
4. Use **bold** for emphasis on names or key facts.
5. If the user asks in Chinese, respond in Chinese but keep the structure clear and spaced out.
</instructions>
`;

} catch (error) {
    console.error('Error preloading data.json (Cold Start):', error);
    FINAL_SYSTEM_PROMPT = "Error: Could not load site data. Please contact admin.";
}

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            return response.status(500).json({ reply: "Server configuration error: API key is missing." });
        }

        const { userQuery, history } = request.body;
        const cleanQuery = sanitizeText(userQuery);

        // MIGRATION: Google GenAI SDK (v1.0+)
        const client = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

        // Chat Session
        // MODEL FALLBACK CHAIN
        // Priority: Speed/Quality -> High Capacity Fallbacks
        const MODELS = [
            "gemini-3-flash-preview",    // Frontier intelligence & search (Free)
            "gemini-2.5-pro",            // State-of-the-art reasoning (Free)
            "gemini-2.5-flash",          // Balanced hybrid reasoning (Free)
            "gemini-2.0-flash",          // Balanced multimodal performance (Free)
            "gemini-2.5-flash-lite",     // smallest & most cost-effective (Free)
            "gemini-2.0-flash-lite",     // Optimized for scale (Free)
            "gemma-3-27b",               // High capacity open model (Free)
            "gemma-3-12b",               // Mid-range open model (Free)
            "gemma-3-4b",                // Lightweight device-class (Free)
            "gemma-3-2b",                // Mobile-class (Free)
            "gemma-3-1b"                 // Ultra-lightweight (Free)
        ];

        let text = null;
        let lastError = null;

        for (const modelName of MODELS) {
            try {
                const chat = client.chats.create({
                    model: modelName,
                    config: {
                        systemInstruction: FINAL_SYSTEM_PROMPT,
                        temperature: 0.7,
                    },
                    history: history || []
                });

                const result = await chat.sendMessage({
                    message: cleanQuery
                });

                text = (typeof result.text === 'function') ? result.text() : result.text;
                break; // Success

            } catch (error) {
                console.warn(`Fallback: Model ${modelName} failed.`, error.message);
                lastError = error;
                // Continue to next model
            }
        }

        if (!text) {
            console.error('All models failed. Last error:', lastError);
            throw lastError || new Error("All models failed to respond.");
        }

        return response.status(200).json({ reply: text });

    } catch (error) {
        console.error('Google GenAI SDK Error:', error);
        return response.status(500).json({ reply: "I'm having trouble connecting to the history books right now." });
    }
};
