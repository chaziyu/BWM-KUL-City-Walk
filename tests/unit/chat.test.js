import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const gemini = {
  create: vi.fn(),
  sendMessage: vi.fn(),
};

const genaiPath = require.resolve('@google/genai');
require.cache[genaiPath] = {
  id: genaiPath,
  filename: genaiPath,
  loaded: true,
  exports: {
    GoogleGenAI: function GoogleGenAI() {
      this.chats = {
        create: gemini.create.mockImplementation(() => ({
          sendMessage: gemini.sendMessage,
        })),
      };
    },
  },
};

const chatHandler = require('../../api/chat.js');
const { resetMemoryBucketsForTests } = require('../../api/_shared/rate-limit.js');
const { resetAnswerCacheForTests } = require('../../api/_shared/ai/answer-cache.js');

function createResponse() {
  return {
    body: null,
    statusCode: null,
    headers: {},
    setHeader(key, value) {
      this.headers[key] = value;
    },
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

async function postChat(body, deviceId = randomUUID()) {
  const response = createResponse();
  await chatHandler({
    method: 'POST',
    headers: {
      host: 'app.test',
      origin: 'https://app.test',
      'x-jejak-device': deviceId,
    },
    body,
  }, response);
  return response;
}

async function exhaustQuota(deviceId = randomUUID(), count = 5) {
  const statuses = [];
  for (let index = 0; index < count; index += 1) {
    statuses.push((await postChat({ userQuery: `Tell me about Sultan Abdul Samad Building ${index}` }, deviceId)).statusCode);
  }
  return statuses;
}

describe('chat API quota ordering', () => {
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
    process.env.CHAT_QUOTA_LIMIT = '5';
    resetMemoryBucketsForTests();
    resetAnswerCacheForTests();
    gemini.create.mockClear();
    gemini.sendMessage.mockReset();
    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Answer', sourceSiteIds: ['1'], confidence: 'high', notFound: false }) });
  });

  it('does not consume quota for empty queries', async () => {
    const deviceId = randomUUID();

    expect((await postChat({ userQuery: '   ' }, deviceId)).statusCode).toBe(400);
    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
  });

  it('does not consume quota for invalid request bodies', async () => {
    const deviceId = randomUUID();

    expect((await postChat(null, deviceId)).statusCode).toBe(400);
    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
  });

  it('consumes quota for valid answered requests', async () => {
    const deviceId = randomUUID();

    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
    expect((await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' }, deviceId)).statusCode).toBe(429);
  });

  it('refunds quota when every provider attempt fails', async () => {
    const deviceId = randomUUID();
    gemini.sendMessage.mockRejectedValue(new Error('provider down'));

    expect((await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' }, deviceId)).statusCode).toBe(500);

    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], confidence: 'high', notFound: false }) });
    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
  });

  it('does not call Gemini or consume quota for retrieval misses', async () => {
    const deviceId = randomUUID();

    const result = await postChat({ userQuery: 'Can you recommend stock investments for this week?' }, deviceId);

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toBe('I’m here to help with the BMW KUL City Walk. You can ask about places to visit, route ideas, or the story behind a stop.');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
  });

  it('uses a guide-introduction reply for identity questions outside the verified notes', async () => {
    const result = await postChat({ userQuery: 'siapa awak?' });

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toBe('I’m your AI Tour Guide. I can help with places to visit, route ideas, and stories from the BMW KUL City Walk.');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
  });

  it('uses a route prompt for broad navigation questions outside the verified notes', async () => {
    const deviceId = randomUUID();

    const result = await postChat({ userQuery: 'where can i go?' }, deviceId);

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toBe('A good place to start is Bangunan Sultan Abdul Samad, Masjid Jamek, or Central Market. If you want, I can also suggest a quick route.');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
  });

  it('answers combined identity and visit questions in one normal reply', async () => {
    const deviceId = randomUUID();

    const result = await postChat({ userQuery: 'who are you, suggest where to visit' }, deviceId);

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toBe('I’m your AI Tour Guide. A good place to start is Bangunan Sultan Abdul Samad, Masjid Jamek, or Central Market if you want a shorter wander.');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
  });

  it('does not consume quota for invalid JSON', async () => {
    const deviceId = randomUUID();
    gemini.sendMessage.mockResolvedValue({ text: 'plain text' });

    expect((await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' }, deviceId)).statusCode).toBe(500);

    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], confidence: 'high', notFound: false }) });
    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
  });

  it('falls back to verified site notes for site chat when Gemini fails', async () => {
    gemini.sendMessage.mockRejectedValue(new Error('provider down'));

    const result = await postChat({
      userQuery: 'Tell me more about this site.',
      context: { type: 'site', siteId: '1' },
    });

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toContain('Bangunan Sultan Abdul Samad');
    expect(result.body.sourceSiteIds).toEqual(['1']);
  });

  it('does not consume quota for invalid source IDs', async () => {
    const deviceId = randomUUID();
    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Wrong source', sourceSiteIds: ['999'], confidence: 'high', notFound: false }) });

    const invalid = await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' }, deviceId);

    expect(invalid.statusCode).toBe(200);
    expect(invalid.body.notFound).toBe(true);

    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], confidence: 'high', notFound: false }) });
    expect(await exhaustQuota(deviceId)).toEqual([200, 200, 200, 200, 200]);
  });

  it('uses cached answers without calling Gemini or consuming quota again', async () => {
    const deviceId = randomUUID();
    const question = 'Who designed Sultan Abdul Samad Building?';

    const first = await postChat({ userQuery: question }, deviceId);
    const second = await postChat({ userQuery: question }, deviceId);

    expect(first.body.remainingQuota).toBe(4);
    expect(second.body.remainingQuota).toBe(4);
    expect(gemini.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('uses structured low-temperature Gemini calls', async () => {
    expect((await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' })).statusCode).toBe(200);
    expect(gemini.create.mock.calls[0][0].config.temperature).toBe(0.2);
    expect(gemini.create.mock.calls[0][0].config.systemInstruction).toContain('Return only JSON');
  });

  it('returns 504 when Gemini model calls time out', async () => {
    const timeoutError = new Error('Service took too long; please retry');
    timeoutError.name = 'TimeoutError';
    timeoutError.status = 504;
    gemini.sendMessage.mockRejectedValue(timeoutError);

    const result = await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' });
    expect(result.statusCode).toBe(504);
    expect(result.body.reply).toBe('Service took too long; please retry');
  });

  it('returns 503 when quota backend fails in production', async () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      const result = await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' });
      expect(result.statusCode).toBe(503);
      expect(result.body.reply).toBe('The access service is temporarily unavailable. Please try again shortly.');
    } finally {
      process.env.NODE_ENV = originalEnv;
    }
  });

  it('consumes rate limit capacity even for no-match queries', async () => {
    const originalMax = process.env.CHAT_RATE_LIMIT_MAX;
    process.env.CHAT_RATE_LIMIT_MAX = '1';
    const deviceId = randomUUID();
    try {
      const first = await postChat({ userQuery: 'Can you recommend stock investments for this week?' }, deviceId);
      expect(first.statusCode).toBe(200);

      const second = await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' }, deviceId);
      expect(second.statusCode).toBe(429);
    } finally {
      process.env.CHAT_RATE_LIMIT_MAX = originalMax;
    }
  });

  it('consumes rate limit capacity even for cached queries', async () => {
    const originalMax = process.env.CHAT_RATE_LIMIT_MAX;
    process.env.CHAT_RATE_LIMIT_MAX = '1';
    const deviceId = randomUUID();
    try {
      const first = await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' }, deviceId);
      expect(first.statusCode).toBe(200);

      const second = await postChat({ userQuery: 'Who designed Sultan Abdul Samad Building?' }, deviceId);
      expect(second.statusCode).toBe(429);
    } finally {
      process.env.CHAT_RATE_LIMIT_MAX = originalMax;
    }
  });
});
