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
const { CHAT_MODELS, shouldTryFallback, supportsJsonMode } = require('./_shared/ai/model-config');
const { isFollowUpQuery } = require('./_shared/ai/history-policy');
const { getRetrievalConfidence, retrieveSiteMatches } = require('./_shared/ai/retrieve-sites');
const { parseModelResponse, validateResponse } = require('./_shared/ai/response-contract');
const { getSiteById } = require('./_shared/ai/site-catalog');

const MAX_QUERY_CHARS = readInteger('CHAT_MAX_QUERY_CHARS', 1000, { min: 1 });
const MAX_HISTORY_MESSAGES = readInteger('CHAT_HISTORY_MESSAGES', 4, { min: 0, max: 8 });
const MAX_HISTORY_TEXT_CHARS = readInteger('CHAT_HISTORY_TEXT_CHARS', 700, { min: 1, max: 1500 });
const RATE_LIMIT_WINDOW_MS = readInteger('CHAT_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000, { min: 1000 });
const RATE_LIMIT_MAX = readInteger('CHAT_RATE_LIMIT_MAX', 30, { min: 1 });
const PROVIDER_TIMEOUT_MS = readInteger('CHAT_PROVIDER_TIMEOUT_MS', 5000, { min: 1500, max: 15000 });
const MAX_OUTPUT_TOKENS = readInteger('CHAT_MAX_OUTPUT_TOKENS', 512, { min: 128, max: 1024 });

const RESPONSE_JSON_SCHEMA = Object.freeze({
  type: 'object',
  properties: {
    answer: { type: 'string' },
    sourceSiteIds: {
      type: 'array',
      items: { type: 'string' },
    },
    notFound: { type: 'boolean' },
  },
  required: ['answer', 'sourceSiteIds', 'notFound'],
  additionalProperties: false,
});

function sanitizeText(str, maxLength = 4000) {
  if (typeof str !== 'string') return '';
  return str.normalize('NFC')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function normalizeHistory(history, currentQuery) {
  if (!isFollowUpQuery(currentQuery) || !Array.isArray(history)) return [];

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

function getContext(requestContext, cleanQuery) {
  if (requestContext?.type === 'site') {
    const site = getSiteById(requestContext.siteId);
    return {
      sites: site ? [site] : [],
      confidence: site ? 'high' : 'low',
    };
  }

  const matches = retrieveSiteMatches(cleanQuery);
  return {
    sites: matches.map(match => match.site),
    confidence: getRetrievalConfidence(matches),
  };
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

function elapsedMs(startedAt) {
  return Math.max(0, Date.now() - startedAt);
}

function logCompletion(requestId, startedAt, path, fields = {}) {
  logEvent('info', 'chat:complete', {
    requestId,
    path,
    durationMs: elapsedMs(startedAt),
    ...fields,
  });
}

function usageFields(result) {
  const usage = result?.usageMetadata || {};
  return {
    promptTokens: Number(usage.promptTokenCount) || null,
    outputTokens: Number(usage.candidatesTokenCount) || null,
    thinkingTokens: Number(usage.thoughtsTokenCount) || null,
    totalTokens: Number(usage.totalTokenCount) || null,
  };
}

module.exports = async (request, response) => {
  const startedAt = Date.now();
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

  const resolved = getContext(context, cleanQuery);
  const contextSites = resolved.sites;
  const limit = ROLE_LIMITS[session.role] || 0;
  const quotaKey = getQuotaKey(session);

  if (!contextSites.length) {
    logCompletion(requestId, startedAt, 'no-match');
    return response.status(200).json({
      reply: buildNoMatchReply(cleanQuery),
      remainingQuota: null,
    });
  }

  const deterministic = getDeterministicAnswer(cleanQuery, contextSites);
  if (deterministic) {
    logCompletion(requestId, startedAt, 'deterministic', {
      sourceCount: deterministic.sourceSiteIds.length,
    });
    return response.status(200).json({
      reply: sanitizeText(deterministic.answer, 5000),
      sourceSiteIds: deterministic.sourceSiteIds,
      confidence: deterministic.confidence,
      notFound: deterministic.notFound,
      remainingQuota: null,
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
    logCompletion(requestId, startedAt, 'cache', {
      sourceCount: cached.sourceSiteIds?.length || 0,
    });
    return response.status(200).json({
      reply: cached.answer,
      sourceSiteIds: cached.sourceSiteIds,
      confidence: cached.confidence,
      notFound: cached.notFound,
      remainingQuota: null,
    });
  }

  const clientKey = getClientKey(request);
  if (await checkRateLimit(clientKey)) {
    return response.status(429).json({
      reply: 'You have reached the request rate limit for now. Please try again later.',
      remainingQuota: null,
    });
  }

  const GOOGLE_API_KEY = readString('GOOGLE_API_KEY');
  if (!GOOGLE_API_KEY) {
    return response.status(500).json({
      reply: 'Server configuration error: API key is missing.',
      remainingQuota: null,
    });
  }

  const quota = await consumeQuota(quotaKey, limit);
  if (quota.exceeded) {
    return response.status(429).json({
      reply: 'You have reached the AI chat limit for this access mode.',
      remainingQuota: quota.remaining,
    });
  }

  const cleanHistory = normalizeHistory(history, cleanQuery);

  try {
    const client = new GoogleGenAI({
      apiKey: GOOGLE_API_KEY,
      httpOptions: { timeout: PROVIDER_TIMEOUT_MS, headers: {} },
    });

    let contract = null;
    let lastError = null;
    let usedModel = null;

    for (let index = 0; index < CHAT_MODELS.length; index += 1) {
      const modelName = CHAT_MODELS[index];
      const providerStartedAt = Date.now();

      try {
        const config = {
          systemInstruction: buildPrompt(contextSites),
          thinkingConfig: { thinkingLevel: 'minimal' },
          maxOutputTokens: MAX_OUTPUT_TOKENS,
        };

        if (supportsJsonMode(modelName)) {
          config.responseMimeType = 'application/json';
          config.responseJsonSchema = RESPONSE_JSON_SCHEMA;
        }

        const chat = client.chats.create({
          model: modelName,
          config,
          history: cleanHistory,
        });

        const result = await chat.sendMessage({ message: cleanQuery });
        const text = (typeof result.text === 'function') ? result.text() : result.text;
        const parsed = parseModelResponse(text);
        contract = validateResponse(parsed, contextSites, resolved.confidence);
        usedModel = modelName;

        logEvent('info', 'chat:model-success', {
          requestId,
          model: modelName,
          providerMs: elapsedMs(providerStartedAt),
          historyMessages: cleanHistory.length,
          contextSites: contextSites.length,
          ...usageFields(result),
        });
        break;
      } catch (error) {
        logEvent('warn', 'chat:model-failure', {
          requestId,
          model: modelName,
          providerMs: elapsedMs(providerStartedAt),
          status: Number(error?.status) || null,
          code: error?.code || null,
          message: sanitizeLogValue(error?.message || 'Unknown provider error'),
        });

        lastError = error;
        const hasFallback = index < CHAT_MODELS.length - 1;
        if (!hasFallback || !shouldTryFallback(error)) break;
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

    logCompletion(requestId, startedAt, 'model', {
      model: usedModel,
      sourceCount: contract.sourceSiteIds.length,
      confidence: contract.confidence,
      notFound: contract.notFound,
    });

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
      logCompletion(requestId, startedAt, 'site-fallback');
      return response.status(200).json(buildSiteFallback(contextSites[0], refundedRemainingQuota));
    }

    return response.status(500).json({
      code: 'AI_PROVIDER_UNAVAILABLE',
      reply: "I'm having trouble connecting to the history books right now.",
      remainingQuota: refundedRemainingQuota,
    });
  }
};
