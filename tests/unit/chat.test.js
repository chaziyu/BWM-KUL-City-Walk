import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequire } from 'node:module';
import { randomUUID } from 'node:crypto';

const require = createRequire(import.meta.url);
const gemini = {
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
        create: vi.fn(() => ({
          sendMessage: gemini.sendMessage,
        })),
      };
    },
  },
};

const chatHandler = require('../../api/chat.js');
const { createSessionPayload, setSessionCookie } = require('../../api/_shared/session.js');
const { resetMemoryBucketsForTests } = require('../../api/_shared/rate-limit.js');

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
    statuses.push((await postChat(cookie, { userQuery: `Question ${index}` })).statusCode);
  }
  return statuses;
}

describe('chat API quota ordering', () => {
  beforeEach(() => {
    process.env.GOOGLE_API_KEY = 'test-key';
    resetMemoryBucketsForTests();
    gemini.sendMessage.mockReset();
    gemini.sendMessage.mockResolvedValue({ text: 'Answer' });
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
    expect((await postChat(cookie, { userQuery: 'One more' })).statusCode).toBe(429);
  });

  it('refunds quota when every provider attempt fails', async () => {
    const cookie = createCookie();
    gemini.sendMessage.mockRejectedValue(new Error('provider down'));

    expect((await postChat(cookie, { userQuery: 'Hello' })).statusCode).toBe(500);

    gemini.sendMessage.mockResolvedValue({ text: 'Recovered' });
    expect(await exhaustDemoQuota(cookie)).toEqual([200, 200, 200, 200, 200]);
  });
});
