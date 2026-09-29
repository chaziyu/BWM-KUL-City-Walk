import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const gemini = {
  create: vi.fn(),
  sendMessage: vi.fn(),
  clientOptions: [],
};

const genaiPath = require.resolve('@google/genai');
require.cache[genaiPath] = {
  id: genaiPath,
  filename: genaiPath,
  loaded: true,
  exports: {
    GoogleGenAI: function GoogleGenAI(options) {
      gemini.clientOptions.push(options);
      this.chats = {
        create: gemini.create.mockImplementation(() => ({
          sendMessage: gemini.sendMessage,
        })),
      };
    },
  },
};

const chatHandler = require('../../api/chat.js');
const { ROLE_LIMITS, createQuotaSubject, createSessionPayload, setSessionCookie } = require('../../api/_shared/session.js');
const { resetMemoryBucketsForTests } = require('../../api/_shared/rate-limit.js');
const { resetAnswerCacheForTests } = require('../../api/_shared/ai/answer-cache.js');

function createCookie(role = 'demo', options = {}) {
  const headers = {};
  setSessionCookie(
    { setHeader: (key, value) => { headers[key] = value; } },
    createSessionPayload(role, options),
    3600,
  );
  return headers['Set-Cookie'].split(';')[0];
}

function createResponse() {
  return {
    body: null,
    statusCode: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

async function postChat(cookie, body) {
  const response = createResponse();
  await chatHandler({
    method: 'POST',
    headers: {
      cookie,
      host: 'app.test',
      origin: 'https://app.test',
      'x-jejak-device': randomUUID(),
    },
    body,
  }, response);
  return response;
}

async function exhaustDemoQuota(cookie) {
  const statuses = [];
  for (let index = 0; index < 5; index += 1) {
    statuses.push((await postChat(cookie, {
      userQuery: `Why is Sultan Abdul Samad Building important? ${index}`,
    })).statusCode);
  }
  return statuses;
}

describe('chat API quota ordering and Flash-Lite tuning', () => {
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
    resetMemoryBucketsForTests();
    resetAnswerCacheForTests();
    gemini.create.mockClear();
    gemini.sendMessage.mockReset();
    gemini.clientOptions.length = 0;
    gemini.sendMessage.mockResolvedValue({
      text: JSON.stringify({ answer: 'Answer', sourceSiteIds: ['1'], notFound: false }),
    });
  });

  it('does not consume quota for empty queries', async () => {
    const cookie = createCookie();

    expect((await postChat(cookie, { userQuery: '   ' })).statusCode).toBe(400);
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('does not consume quota for invalid request bodies', async () => {
    const cookie = createCookie();

    expect((await postChat(cookie, null)).statusCode).toBe(400);
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('consumes quota only for model-backed requests', async () => {
    const cookie = createCookie();

    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
    expect((await postChat(cookie, {
      userQuery: 'Why is Sultan Abdul Samad Building architecturally important?',
    })).statusCode).toBe(429);
  });

  it('refunds quota when the provider fails', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockRejectedValue(new Error('provider down'));

    const failed = await postChat(cookie, {
      userQuery: 'Why is Sultan Abdul Samad Building important?',
    });
    expect(failed.statusCode).toBe(500);
    expect(failed.body.code).toBe('AI_PROVIDER_UNAVAILABLE');

    gemini.sendMessage.mockResolvedValue({
      text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], notFound: false }),
    });
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('answers structured factual questions without Gemini or quota I/O', async () => {
    const cookie = createCookie();

    const built = await postChat(cookie, {
      userQuery: 'When was Sultan Abdul Samad Building built?',
    });
    const architect = await postChat(cookie, {
      userQuery: 'Who designed Sultan Abdul Samad Building?',
    });

    expect(built.statusCode).toBe(200);
    expect(built.body.reply).toContain('1894-1897');
    expect(built.body.remainingQuota).toBeNull();
    expect(architect.body.reply).toContain('A.B. Hubback');
    expect(architect.body.remainingQuota).toBeNull();
    expect(gemini.sendMessage).not.toHaveBeenCalled();
  });

  it('answers multilingual structured facts without Gemini', async () => {
    const cookie = createCookie();

    const chinese = await postChat(cookie, { userQuery: '中央市场几点开？' });
    const malay = await postChat(cookie, { userQuery: 'siapa arkitek Masjid Jamek?' });

    expect(chinese.statusCode).toBe(200);
    expect(chinese.body.reply).toContain('开放时间');
    expect(chinese.body.sourceSiteIds).toEqual(['D']);
    expect(malay.statusCode).toBe(200);
    expect(malay.body.reply).toContain('direka oleh');
    expect(malay.body.sourceSiteIds).toEqual(['4']);
    expect(gemini.sendMessage).not.toHaveBeenCalled();
  });

  it('does not call Gemini or consume quota for retrieval misses', async () => {
    const cookie = createCookie();

    const result = await postChat(cookie, {
      userQuery: 'Can you recommend stock investments for this week?',
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.remainingQuota).toBeNull();
    expect(result.body.reply).toBe('I’m here to help with the BWM KUL City Walk. You can ask about places to visit, route ideas, or the story behind a stop.');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('uses local replies for identity and broad navigation questions', async () => {
    const cookie = createCookie();

    const identity = await postChat(cookie, { userQuery: 'siapa awak?' });
    const route = await postChat(cookie, { userQuery: 'where can i go?' });
    const combined = await postChat(cookie, {
      userQuery: 'who are you, suggest where to visit',
    });

    expect(identity.body.reply).toContain('AI Tour Guide');
    expect(route.body.reply).toContain('good place to start');
    expect(combined.body.reply).toContain('AI Tour Guide');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
  });

  it('does not consume quota for invalid provider JSON', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockResolvedValue({ text: 'plain text' });

    expect((await postChat(cookie, {
      userQuery: 'Why is Sultan Abdul Samad Building important?',
    })).statusCode).toBe(500);

    gemini.sendMessage.mockResolvedValue({
      text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], notFound: false }),
    });
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('falls back to verified site notes for site chat when Gemini fails', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockRejectedValue(new Error('provider down'));

    const result = await postChat(cookie, {
      userQuery: 'Tell me more about this site.',
      context: { type: 'site', siteId: '1' },
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toContain('Bangunan Sultan Abdul Samad');
    expect(result.body.sourceSiteIds).toEqual(['1']);
  });

  it('refunds quota for invalid source IDs and returns a safe not-found contract', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockResolvedValue({
      text: JSON.stringify({ answer: 'Wrong source', sourceSiteIds: ['999'], notFound: false }),
    });

    const invalid = await postChat(cookie, {
      userQuery: 'Why is Sultan Abdul Samad Building important?',
    });

    expect(invalid.statusCode).toBe(200);
    expect(invalid.body.notFound).toBe(true);

    gemini.sendMessage.mockResolvedValue({
      text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], notFound: false }),
    });
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('keeps visitor quota across recreated sessions with the same signed subject', async () => {
    const originalLimit = ROLE_LIMITS.visitor;
    ROLE_LIMITS.visitor = 2;

    try {
      const quotaSubject = createQuotaSubject('visitor:AB-12345:device-1');
      const firstSession = createCookie('visitor', { quotaSubject });
      const secondSession = createCookie('visitor', { quotaSubject });

      expect((await postChat(firstSession, {
        userQuery: 'Why is Sultan Abdul Samad Building important? visitor one',
      })).statusCode).toBe(200);
      expect((await postChat(secondSession, {
        userQuery: 'Why is Sultan Abdul Samad Building important? visitor two',
      })).statusCode).toBe(200);

      const blocked = await postChat(secondSession, {
        userQuery: 'Why is Sultan Abdul Samad Building important? visitor three',
      });
      expect(blocked.statusCode).toBe(429);
      expect(blocked.body.remainingQuota).toBe(0);
    } finally {
      ROLE_LIMITS.visitor = originalLimit;
    }
  });

  it('uses cached answers without another Gemini call or quota update', async () => {
    const cookie = createCookie();
    const question = 'Why is Sultan Abdul Samad Building important?';

    const first = await postChat(cookie, { userQuery: question });
    const second = await postChat(cookie, { userQuery: question });

    expect(first.body.remainingQuota).toBe(4);
    expect(second.body.remainingQuota).toBeNull();
    expect(gemini.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('uses one structured Flash-Lite fallback for retriable provider errors', async () => {
    const cookie = createCookie();
    gemini.sendMessage
      .mockRejectedValueOnce(Object.assign(new Error('primary unavailable'), { status: 503 }))
      .mockResolvedValueOnce({
        text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], notFound: false }),
      });

    const result = await postChat(cookie, {
      userQuery: 'Why is Sultan Abdul Samad Building important?',
    });

    expect(result.statusCode).toBe(200);
    expect(gemini.create.mock.calls[0][0].model).toBe('gemini-3.5-flash-lite');
    expect(gemini.create.mock.calls[1][0].model).toBe('gemini-3.1-flash-lite');
    expect(gemini.create.mock.calls[1][0].config.responseMimeType).toBe('application/json');
    expect(result.body.reply).toBe('Recovered');
  });

  it('does not cascade to fallback models for non-retriable errors', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockRejectedValueOnce(
      Object.assign(new Error('bad request'), { status: 400 }),
    );

    const result = await postChat(cookie, {
      userQuery: 'Why is Sultan Abdul Samad Building important?',
    });

    expect(result.statusCode).toBe(500);
    expect(gemini.create).toHaveBeenCalledTimes(1);
  });

  it('uses minimal thinking, bounded output, timeout, structured JSON, and no sampling override', async () => {
    const cookie = createCookie();

    expect((await postChat(cookie, {
      userQuery: 'Why is Sultan Abdul Samad Building important?',
    })).statusCode).toBe(200);

    const config = gemini.create.mock.calls[0][0].config;
    expect(config.temperature).toBeUndefined();
    expect(config.topP).toBeUndefined();
    expect(config.topK).toBeUndefined();
    expect(config.thinkingConfig).toEqual({ thinkingLevel: 'minimal' });
    expect(config.maxOutputTokens).toBe(512);
    expect(config.systemInstruction).toContain('Use only the verified site fields below.');
    expect(config.responseMimeType).toBe('application/json');
    expect(config.responseJsonSchema.required).toEqual([
      'answer',
      'sourceSiteIds',
      'notFound',
    ]);
    expect(gemini.clientOptions[0].httpOptions.timeout).toBe(5000);
  });

  it('drops history for standalone questions and keeps it for dependent follow-ups', async () => {
    const cookie = createCookie();
    const history = [
      { role: 'user', parts: [{ text: 'Tell me about Masjid Jamek' }] },
      { role: 'model', parts: [{ text: 'Earlier answer' }] },
    ];

    await postChat(cookie, {
      userQuery: 'Why is Sultan Abdul Samad Building important?',
      history,
    });
    expect(gemini.create.mock.calls[0][0].history).toEqual([]);

    gemini.create.mockClear();
    await postChat(cookie, {
      userQuery: 'tell me more',
      context: { type: 'site', siteId: '1' },
      history,
    });
    expect(gemini.create.mock.calls[0][0].history).toHaveLength(2);
  });
});
