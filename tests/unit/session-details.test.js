import { afterEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createSessionPayload,
  getSafeSessionDetails,
  setSessionCookie,
} = require('../../api/_shared/session.js');

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) delete process.env[key];
  }
  Object.assign(process.env, originalEnv);
});

describe('safe session details', () => {
  it('isolates progress storage by authenticated role', () => {
    expect(getSafeSessionDetails(createSessionPayload('demo')).progressNamespace).toBe('demo');
    expect(getSafeSessionDetails(createSessionPayload('visitor')).progressNamespace).toBe('visitor');
    expect(getSafeSessionDetails(createSessionPayload('admin')).progressNamespace).toBe('admin');
  });

  it('uses Secure cookies for hosted Vercel previews', () => {
    process.env.VERCEL = '1';
    process.env.VERCEL_ENV = 'preview';
    const headers = {};
    setSessionCookie({
      setHeader(name, value) {
        headers[name] = value;
      },
    }, createSessionPayload('demo'), 3600);

    expect(headers['Set-Cookie']).toContain('Secure');
    expect(headers['Set-Cookie']).toContain('HttpOnly');
    expect(headers['Set-Cookie']).toContain('SameSite=Lax');
  });
});
