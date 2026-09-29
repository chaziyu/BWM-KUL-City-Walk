import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { readInteger } = require('../../api/_shared/config.js');
const { isSameOrigin } = require('../../api/_shared/security.js');
const healthHandler = require('../../api/health.js');
const demoHandler = require('../../api/session/demo.js');

function responseStub() {
  return {
    statusCode: 200,
    body: null,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

describe('API infrastructure', () => {
  it('treats empty integer environment settings as unset', () => {
    process.env.TEST_INTEGER_SETTING = '';
    expect(readInteger('TEST_INTEGER_SETTING', 42)).toBe(42);

    process.env.TEST_INTEGER_SETTING = '12';
    expect(readInteger('TEST_INTEGER_SETTING', 42)).toBe(12);
  });

  it('validates request origin against the current host', () => {
    expect(isSameOrigin({
      headers: { host: 'example.com', origin: 'https://example.com' },
    })).toBe(true);

    expect(isSameOrigin({
      headers: { host: 'example.com', origin: 'https://evil.example' },
    })).toBe(false);
  });

  it('exposes secret-free health status and a correlation id', async () => {
    process.env.GOOGLE_API_KEY = 'configured';
    process.env.SESSION_SECRET = 'configured';
    const response = responseStub();

    await healthHandler({ method: 'GET', headers: {} }, response);

    expect(response.statusCode).toBe(200);
    expect(response.headers['X-Request-Id']).toBeTruthy();
    expect(response.body.status).toBe('ok');
    expect(response.body.services.aiConfigured).toBe(true);
    expect(response.body.services.sessionSecretConfigured).toBe(true);
    expect(response.body).not.toHaveProperty('GOOGLE_API_KEY');
  });

  it('rejects state-changing session requests without same-origin evidence', async () => {
    const response = responseStub();

    await demoHandler({
      method: 'POST',
      headers: { host: 'example.com', origin: 'https://evil.example' },
    }, response);

    expect(response.statusCode).toBe(403);
    expect(response.body.code).toBe('SAME_ORIGIN_REQUIRED');
  });
});
