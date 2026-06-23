// File: /api/chat.js
const { GoogleGenAI } = require("@google/genai");

const { ROLE_LIMITS, getSessionFromRequest } = require('./_shared/session');
const { consumeQuota, getQuotaRemaining, isRateLimited } = require('./_shared/rate-limit');
const { buildCacheKey, getCachedAnswer, getLanguage, isCacheableQuestion, setCachedAnswer } = require('./_shared/ai/answer-cache');
const { buildPrompt } = require('./_shared/ai/build-prompt');
const { retrieveSites } = require('./_shared/ai/retrieve-sites');
const { parseModelResponse, validateResponse } = require('./_shared/ai/response-contract');
const { getSiteById } = require('./_shared/ai/site-catalog');

const MAX_QUERY_CHARS = Number(process.env.CHAT_MAX_QUERY_CHARS) || 1000;
const MAX_HISTORY_MESSAGES = Number(process.env.CHAT_HISTORY_MESSAGES) || 10;
const MAX_HISTORY_TEXT_CHARS = Number(process.env.CHAT_HISTORY_TEXT_CHARS) || 1500;
const RATE_LIMIT_WINDOW_MS = Number(process.env.CHAT_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;
const RATE_LIMIT_MAX = Number(process.env.CHAT_RATE_LIMIT_MAX) || 30;

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

async function checkRateLimit(key) {
    return await isRateLimited(`chat:${key}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
}

function getQuotaWindow(session) {
    const now = new Date();
    if (session.role === 'admin') {
        return `${now.getUTCFullYear()}-${now.getUTCMonth()}-${now.getUTCDate()}-${now.getUTCHours()}`;
    }

    if (session.role === 'visitor') {
        return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kuala_Lumpur' });
    }

    return session.sessionId;
}

function getContextSites(context, cleanQuery) {
    if (context?.type === 'site') {
        const site = getSiteById(context.siteId);
        return site ? [site] : [];
    }

    return retrieveSites(cleanQuery);
}

function buildSiteFallback(site, remainingQuota) {
    const answer = [
        `**${site.name}**`,
        site.aiContext || site.infoMore || site.info,
    ].filter(Boolean).join('\n\n');

    return {
        reply: sanitizeText(answer, 5000),
        sourceSiteIds: [site.id],
        confidence: 'low',
        notFound: false,
        remainingQuota,
    };
}

function buildNoMatchReply(query) {
    const text = String(query || '').toLowerCase();
    const hasIdentityIntent = /(who are you|what are you|siapa awak|siapa anda|awak siapa|anda siapa)/.test(text);
    const hasRouteIntent = /(where can i go|where should i go|what can i visit|what should i visit|nearby|route|directions|mana boleh pergi|ke mana|nak pergi mana|boleh pergi mana|suggest where to visit|recommend where to visit)/.test(text);

    if (hasIdentityIntent && hasRouteIntent) {
        return 'I’m your AI Tour Guide. A good place to start is Bangunan Sultan Abdul Samad, Masjid Jamek, or Central Market if you want a shorter wander.';
    }

    if (hasIdentityIntent) {
        return 'I’m your AI Tour Guide. I can help with places to visit, route ideas, and stories from the BMW KUL City Walk.';
    }

    if (hasRouteIntent) {
        return 'A good place to start is Bangunan Sultan Abdul Samad, Masjid Jamek, or Central Market. If you want, I can also suggest a quick route.';
    }

    return 'I’m here to help with the BMW KUL City Walk. You can ask about places to visit, route ideas, or the story behind a stop.';
}

module.exports = async (request, response) => {
    if (request.method !== 'POST') {
        return response.status(405).json({ error: 'Method not allowed' });
    }

    if (!isSameOrigin(request)) {
        return response.status(403).json({ reply: 'Chat access is only available from the app.' });
    }

    const session = getSessionFromRequest(request);
    if (!session || !['demo', 'visitor', 'admin'].includes(session.role)) {
        return response.status(401).json({ reply: 'Please unlock the app before using the AI guide.' });
    }

    const { userQuery, context, history } = request.body || {};
    const cleanQuery = sanitizeText(userQuery, MAX_QUERY_CHARS);
    if (!cleanQuery) {
        return response.status(400).json({ reply: 'Please enter a question.' });
    }

    const contextSites = getContextSites(context, cleanQuery);
    const limit = ROLE_LIMITS[session.role] || 0;
    const quotaKey = `chat-quota:${session.role}:${session.sessionId}:${getQuotaWindow(session)}`;
    const remainingQuota = await getQuotaRemaining(quotaKey, limit);
    if (!contextSites.length) {
        return response.status(200).json({ reply: buildNoMatchReply(cleanQuery), remainingQuota });
    }
    const cacheKey = buildCacheKey({
        contextType: context?.type === 'site' ? 'site' : 'general',
        siteIds: contextSites.map(site => site.id),
        language: getLanguage(cleanQuery),
        question: cleanQuery,
    });
    const canCache = isCacheableQuestion(cleanQuery);
    const cached = canCache ? getCachedAnswer(cacheKey) : null;
    if (cached) {
        return response.status(200).json({
            reply: cached.answer,
            sourceSiteIds: cached.sourceSiteIds,
            confidence: cached.confidence,
            notFound: cached.notFound,
            remainingQuota,
        });
    }

    const clientKey = getClientKey(request);
    if (await checkRateLimit(clientKey)) {
        return response.status(429).json({ reply: 'You have reached the AI chat limit for now. Please try again later.' });
    }

    const cleanHistory = normalizeHistory(history);

    try {
        const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
        if (!GOOGLE_API_KEY) {
            return response.status(500).json({ reply: "Server configuration error: API key is missing." });
        }

        const client = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

        const MODELS = [
            "gemini-2.5-flash-lite",
            "gemini-2.5-flash",
        ];

        let contract = null;
        let lastError = null;

        for (const modelName of MODELS) {
            try {
                const chat = client.chats.create({
                    model: modelName,
                    config: {
                        systemInstruction: buildPrompt(contextSites),
                        temperature: 0.2,
                    },
                    history: cleanHistory
                });

                const result = await chat.sendMessage({
                    message: cleanQuery
                });

                const text = (typeof result.text === 'function') ? result.text() : result.text;
                contract = validateResponse(parseModelResponse(text), contextSites);
                break;

            } catch (error) {
                console.warn(`Fallback: Model ${modelName} failed.`, error.message);
                lastError = error;
            }
        }

        if (!contract) {
            console.error('All models failed. Last error:', lastError);
            throw lastError || new Error("All models failed to respond.");
        }

        if (!contract.notFound) {
            const quota = await consumeQuota(quotaKey, limit);
            if (quota.exceeded) {
                return response.status(429).json({ reply: 'You have reached the AI chat limit for this access mode.', remainingQuota: quota.remaining });
            }
            contract.remainingQuota = quota.remaining;
        } else {
            contract.remainingQuota = remainingQuota;
        }

        if (canCache) setCachedAnswer(cacheKey, contract);

        return response.status(200).json({
            reply: sanitizeText(contract.answer, 5000),
            sourceSiteIds: contract.sourceSiteIds,
            confidence: contract.confidence,
            notFound: contract.notFound,
            remainingQuota: contract.remainingQuota,
        });

    } catch (error) {
        console.error('Google GenAI SDK Error:', error);
        if (context?.type === 'site' && contextSites[0]) {
            return response.status(200).json(buildSiteFallback(contextSites[0], remainingQuota));
        }

        return response.status(500).json({ reply: "I'm having trouble connecting to the history books right now." });
    }
};
