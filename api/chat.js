// File: /api/chat.js
const { GoogleGenAI } = require("@google/genai");

const { readInteger, readString } = require('./_shared/config');
const { getClientIp, requireMethod } = require('./_shared/http');
const { attachRequestContext, logEvent, sanitizeLogValue } = require('./_shared/observability');
const { isSameOrigin } = require('./_shared/security');
const { ROLE_LIMITS, getSessionFromRequest } = require('./_shared/session');
const { consumeQuota, getQuotaRemaining, isRateLimited, refundQuota } = require('./_shared/rate-limit');
const { getQuotaKey } = require('./_shared/chat-quota');
const { buildCacheKey, getLanguage, isCacheableQuestion } = require('./_shared/ai/answer-cache');
const { getDeterministicAnswer } = require('./_shared/ai/deterministic-answer');
const { getSharedCachedAnswer, setSharedCachedAnswer } = require('./_shared/ai/shared-answer-cache');
const { buildPrompt } = require('./_shared/ai/build-prompt');
const { CHAT_MODELS, supportsJsonMode } = require('./_shared/ai/model-config');
const { retrieveSites } = require('./_shared/ai/retrieve-sites');
const { parseModelResponse, validateResponse } = require('./_shared/ai/response-contract');
const { getSiteById } = require('./_shared/ai/site-catalog');

const MAX_QUERY_CHARS = readInteger('CHAT_MAX_QUERY_CHARS', 1000, { min: 1 });
const MAX_HISTORY_MESSAGES = readInteger('CHAT_HISTORY_MESSAGES', 10, { min: 0 });
const MAX_HISTORY_TEXT_CHARS = readInteger('CHAT_HISTORY_TEXT_CHARS', 1500, { min: 1 });
const RATE_LIMIT_WINDOW_MS = readInteger('CHAT_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000, { min: 1000 });
const RATE_LIMIT_MAX = readInteger('CHAT_RATE_LIMIT_MAX', 30, { min: 1 });

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

function getClientKey(request) {
    const device = sanitizeText(request.headers['x-jejak-device'] || 'unknown-device', 80);
    return `${getClientIp(request)}|${device}`;
}

async function checkRateLimit(key) {
    return await isRateLimited(`chat:${key}`, RATE_LIMIT_MAX, RATE_LIMIT_WINDOW_MS);
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
        return 'I’m your AI Tour Guide. I can help with places to visit, route ideas, and stories from the BWM KUL City Walk.';
    }

    if (hasRouteIntent) {
        return 'A good place to start is Bangunan Sultan Abdul Samad, Masjid Jamek, or Central Market. If you want, I can also suggest a quick route.';
    }

    return 'I’m here to help with the BWM KUL City Walk. You can ask about places to visit, route ideas, or the story behind a stop.';
}

module.exports = async (request, response) => {
    const requestId = attachRequestContext(request, response);
    if (!requireMethod(request, response, 'POST')) return;

    if (!isSameOrigin(request)) {
        return response.status(403).json({
            code: 'SAME_ORIGIN_REQUIRED',
            reply: 'Chat access is only available from the app.',
        });
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
    const quotaKey = getQuotaKey(session);
    const remainingQuota = await getQuotaRemaining(quotaKey, limit);
    if (!contextSites.length) {
        return response.status(200).json({ reply: buildNoMatchReply(cleanQuery), remainingQuota });
    }

    const deterministic = getDeterministicAnswer(cleanQuery, contextSites);
    if (deterministic) {
        return response.status(200).json({
            reply: sanitizeText(deterministic.answer, 5000),
            sourceSiteIds: deterministic.sourceSiteIds,
            confidence: deterministic.confidence,
            notFound: deterministic.notFound,
            remainingQuota,
        });
    }

    const cacheKey = buildCacheKey({
        contextType: context?.type === 'site' ? 'site' : 'general',
        siteIds: contextSites.map(site => site.id),
        language: getLanguage(cleanQuery),
        question: cleanQuery,
    });
    const canCache = isCacheableQuestion(cleanQuery);
    const cached = canCache ? await getSharedCachedAnswer(cacheKey) : null;
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
        return response.status(429).json({
            reply: 'You have reached the request rate limit for now. Please try again later.',
            remainingQuota
        });
    }

    const GOOGLE_API_KEY = readString('GOOGLE_API_KEY');
    if (!GOOGLE_API_KEY) {
        return response.status(500).json({
            reply: 'Server configuration error: API key is missing.',
            remainingQuota
        });
    }

    const quota = await consumeQuota(quotaKey, limit);
    if (quota.exceeded) {
        return response.status(429).json({
            reply: 'You have reached the AI chat limit for this access mode.',
            remainingQuota: quota.remaining
        });
    }

    const cleanHistory = normalizeHistory(history);

    try {
        const client = new GoogleGenAI({ apiKey: GOOGLE_API_KEY });

        let contract = null;
        let lastError = null;

        for (const modelName of CHAT_MODELS) {
            try {
                const config = {
                    systemInstruction: buildPrompt(contextSites),
                    temperature: 0.2,
                };
                if (supportsJsonMode(modelName)) {
                    config.responseMimeType = 'application/json';
                    config.responseJsonSchema = {
                        type: 'object',
                        properties: {
                            answer: { type: 'string' },
                            sourceSiteIds: {
                                type: 'array',
                                items: { type: 'string' },
                            },
                            confidence: {
                                type: 'string',
                                enum: ['high', 'medium', 'low'],
                            },
                            notFound: { type: 'boolean' },
                        },
                        required: ['answer', 'sourceSiteIds', 'confidence', 'notFound'],
                        additionalProperties: false,
                    };
                }

                const chat = client.chats.create({
                    model: modelName,
                    config,
                    history: cleanHistory
                });

                const result = await chat.sendMessage({
                    message: cleanQuery
                });

                const text = (typeof result.text === 'function') ? result.text() : result.text;
                contract = validateResponse(parseModelResponse(text), contextSites);
                break;

            } catch (error) {
                logEvent('warn', 'chat:model-failure', {
                    requestId,
                    model: modelName,
                    status: Number(error?.status) || null,
                    code: error?.code || null,
                    message: sanitizeLogValue(error?.message || 'Unknown provider error'),
                });
                lastError = error;
            }
        }

        if (!contract) {
            logEvent('error', 'chat:all-models-failed', {
                requestId,
                models: CHAT_MODELS,
                lastStatus: Number(lastError?.status) || null,
                lastCode: lastError?.code || null,
            });
            throw lastError || new Error('All models failed to respond.');
        }

        if (!contract.notFound) {
            contract.remainingQuota = quota.remaining;
        } else {
            await refundQuota(quotaKey);
            contract.remainingQuota = await getQuotaRemaining(quotaKey, limit);
        }

        if (canCache) await setSharedCachedAnswer(cacheKey, contract);

        return response.status(200).json({
            reply: sanitizeText(contract.answer, 5000),
            sourceSiteIds: contract.sourceSiteIds,
            confidence: contract.confidence,
            notFound: contract.notFound,
            remainingQuota: contract.remainingQuota,
        });

    } catch (error) {
        logEvent('error', 'chat:provider-error', {
            requestId,
            status: Number(error?.status) || null,
            code: error?.code || null,
            message: sanitizeLogValue(error?.message || 'Unknown provider error'),
        });
        await refundQuota(quotaKey);
        const refundedRemainingQuota = await getQuotaRemaining(quotaKey, limit);

        if (context?.type === 'site' && contextSites[0]) {
            return response.status(200).json(buildSiteFallback(contextSites[0], refundedRemainingQuota));
        }

        return response.status(500).json({
            code: 'AI_PROVIDER_UNAVAILABLE',
            reply: "I'm having trouble connecting to the history books right now.",
            remainingQuota: refundedRemainingQuota
        });
    }
};
