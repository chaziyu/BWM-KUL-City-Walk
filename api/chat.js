// File: /api/chat.js
const { GoogleGenAI } = require("@google/genai");
const path = require('path');
const fs = require('fs');

const { GENERAL_KNOWLEDGE } = require('../general_knowledge.js');

const MAX_QUERY_CHARS = Number(process.env.CHAT_MAX_QUERY_CHARS) || 1000;
const MAX_HISTORY_MESSAGES = Number(process.env.CHAT_HISTORY_MESSAGES) || 10;
const MAX_HISTORY_TEXT_CHARS = Number(process.env.CHAT_HISTORY_TEXT_CHARS) || 1500;
const RATE_LIMIT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.CHAT_RATE_LIMIT_MAX) || 30;
const rateBuckets = new Map();

// --- CONTEXT ENGINEERING LAYER: SANITIZATION ---
function sanitizeText(str, maxLength = 4000) {
    if (typeof str !== 'string') return '';
    return str.normalize('NFC')
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
        .slice(0, maxLength);
}

function escapeAttr(str) {
    return sanitizeText(str, 200)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function normalizeHistory(history) {
    if (!Array.isArray(history)) return [];

    return history.slice(-MAX_HISTORY_MESSAGES).map(message => {
        const role = message?.role === 'model' ? 'model' : message?.role === 'user' ? 'user' : null;
        const text = sanitizeText(message?.parts?.[0]?.text || message?.text || '', MAX_HISTORY_TEXT_CHARS);
        if (!role || !text) return null;
        return { role, parts: [{ text }] };
    }).filter(Boolean);
}

function isSameOrigin(request) {
    const host = request.headers.host;
    const origin = request.headers.origin;
    const referer = request.headers.referer;

    try {
        if (origin && new URL(origin).host === host) return true;
        if (referer && new URL(referer).host === host) return true;
    } catch (e) {
        return false;
    }

    return false;
}

function getClientKey(request) {
    const forwardedFor = request.headers['x-forwarded-for'];
    const ip = Array.isArray(forwardedFor) ? forwardedFor[0] : (forwardedFor || request.socket?.remoteAddress || 'unknown');
    const device = sanitizeText(request.headers['x-jejak-device'] || 'unknown-device', 80);
    return `${ip.split(',')[0].trim()}|${device}`;
}

function isRateLimited(key) {
    const now = Date.now();
    const bucket = rateBuckets.get(key) || [];
    const recent = bucket.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW_MS);

    if (recent.length >= RATE_LIMIT_MAX) {
        rateBuckets.set(key, recent);
        return true;
    }

    recent.push(now);
    rateBuckets.set(key, recent);
    return false;
}

// --- OPTIMIZATION: GLOBAL CONTEXT CACHING ---
let FINAL_SYSTEM_PROMPT = "";
try {
    const jsonPath = path.join(process.cwd(), 'data.json');
    const sites = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

    let siteContext = "\n<knowledge_base_sites>";

    for (const site of sites) {
        if (!site?.id || !site?.name) continue;

        const rawContext = site.ai_context || site.info;
        const cleanContext = sanitizeText(rawContext);

        if (cleanContext) {
            siteContext += `\n<site id="${escapeAttr(site.id)}" name="${escapeAttr(site.name)}">\n${cleanContext}\n</site>`;
        }
    }
    siteContext += "\n</knowledge_base_sites>";

    FINAL_SYSTEM_PROMPT = `
<system_identity>
${sanitizeText(GENERAL_KNOWLEDGE, 12000)}
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

    if (!isSameOrigin(request)) {
        return response.status(403).json({ reply: 'Chat access is only available from the app.' });
    }

    const role = sanitizeText(request.headers['x-jejak-role'] || '', 20);
    if (!['user', 'admin'].includes(role)) {
        return response.status(401).json({ reply: 'Please unlock the app before using the AI guide.' });
    }

    const clientKey = getClientKey(request);
    if (isRateLimited(clientKey)) {
        return response.status(429).json({ reply: 'You have reached the AI chat limit for now. Please try again later.' });
    }

    try {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            return response.status(500).json({ reply: "Server configuration error: API key is missing." });
        }

        const { userQuery, history } = request.body || {};
        const cleanQuery = sanitizeText(userQuery, MAX_QUERY_CHARS);
        if (!cleanQuery) {
            return response.status(400).json({ reply: 'Please enter a question.' });
        }

        const cleanHistory = normalizeHistory(history);
        const client = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

        const MODELS = [
            "gemini-3.1-flash-lite",
            "gemma-4-31b-it",
            "gemma-4-26b-a4b-it",
            "gemini-2.5-flash-lite",
            "gemini-3-flash",
            "gemini-3.5-flash",
            "gemini-2.5-flash"
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
                    history: cleanHistory
                });

                const result = await chat.sendMessage({
                    message: cleanQuery
                });

                text = (typeof result.text === 'function') ? result.text() : result.text;
                break;

            } catch (error) {
                console.warn(`Fallback: Model ${modelName} failed.`, error.message);
                lastError = error;
            }
        }

        if (!text) {
            console.error('All models failed. Last error:', lastError);
            throw lastError || new Error("All models failed to respond.");
        }

        return response.status(200).json({ reply: sanitizeText(text, 5000) });

    } catch (error) {
        console.error('Google GenAI SDK Error:', error);
        return response.status(500).json({ reply: "I'm having trouble connecting to the history books right now." });
    }
};
