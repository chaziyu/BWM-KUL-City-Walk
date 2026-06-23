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
const { createSessionPayload, setSessionCookie } = require('../../api/_shared/session.js');
const { resetMemoryBucketsForTests } = require('../../api/_shared/rate-limit.js');
const { resetAnswerCacheForTests } = require('../../api/_shared/ai/answer-cache.js');

function createCookie() {
  const headers = {};
  setSessionCookie({ setHeader: (key, value) => { headers[key] = value; } }, createSessionPayload('demo'), 3600);
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
    statuses.push((await postChat(cookie, { userQuery: `Tell me about Sultan Abdul Samad Building ${index}` })).statusCode);
  }
  return statuses;
}

describe('chat API quota ordering', () => {
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
    resetMemoryBucketsForTests();
    resetAnswerCacheForTests();
    gemini.create.mockClear();
    gemini.sendMessage.mockReset();
    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Answer', sourceSiteIds: ['1'], confidence: 'high', notFound: false }) });
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

  it('consumes quota for valid answered requests', async () => {
    const cookie = createCookie();

    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
    expect((await postChat(cookie, { userQuery: 'Who designed Sultan Abdul Samad Building?' })).statusCode).toBe(429);
  });

  it('refunds quota when every provider attempt fails', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockRejectedValue(new Error('provider down'));

    expect((await postChat(cookie, { userQuery: 'Who designed Sultan Abdul Samad Building?' })).statusCode).toBe(500);

    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], confidence: 'high', notFound: false }) });
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('does not call Gemini or consume quota for retrieval misses', async () => {
    const cookie = createCookie();

    const result = await postChat(cookie, { userQuery: 'Can you recommend stock investments for this week?' });

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toBe('I can help with the verified BMW KUL City Walk stops. Ask me about a place, route, or story along the walk.');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('uses a guide-introduction reply for identity questions outside the verified notes', async () => {
    const cookie = createCookie();

    const result = await postChat(cookie, { userQuery: 'siapa awak?' });

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toBe('I’m your AI Tour Guide for the verified BMW KUL City Walk stops. Ask me about a place, route, or story along the walk.');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
  });

  it('uses a route prompt for broad navigation questions outside the verified notes', async () => {
    const cookie = createCookie();

    const result = await postChat(cookie, { userQuery: 'where can i go?' });

    expect(result.statusCode).toBe(200);
    expect(result.body.reply).toBe('I can help you explore the verified BMW KUL City Walk stops. Ask about a place on the route, or tap a stop on the map to begin.');
    expect(gemini.sendMessage).not.toHaveBeenCalled();
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('does not consume quota for invalid JSON', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockResolvedValue({ text: 'plain text' });

    expect((await postChat(cookie, { userQuery: 'Who designed Sultan Abdul Samad Building?' })).statusCode).toBe(500);

    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], confidence: 'high', notFound: false }) });
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

  it('does not consume quota for invalid source IDs', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Wrong source', sourceSiteIds: ['999'], confidence: 'high', notFound: false }) });

    const invalid = await postChat(cookie, { userQuery: 'Who designed Sultan Abdul Samad Building?' });

    expect(invalid.statusCode).toBe(200);
    expect(invalid.body.notFound).toBe(true);

    gemini.sendMessage.mockResolvedValue({ text: JSON.stringify({ answer: 'Recovered', sourceSiteIds: ['1'], confidence: 'high', notFound: false }) });
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });

  it('uses cached answers without calling Gemini or consuming quota again', async () => {
    const cookie = createCookie();
    const question = 'Who designed Sultan Abdul Samad Building?';

    const first = await postChat(cookie, { userQuery: question });
    const second = await postChat(cookie, { userQuery: question });

    expect(first.body.remainingQuota).toBe(4);
    expect(second.body.remainingQuota).toBe(4);
    expect(gemini.sendMessage).toHaveBeenCalledTimes(1);
  });

  it('uses structured low-temperature Gemini calls', async () => {
    const cookie = createCookie();

    expect((await postChat(cookie, { userQuery: 'Who designed Sultan Abdul Samad Building?' })).statusCode).toBe(200);
    expect(gemini.create.mock.calls[0][0].config.temperature).toBe(0.2);
    expect(gemini.create.mock.calls[0][0].config.systemInstruction).toContain('Return only JSON');
  });
});
