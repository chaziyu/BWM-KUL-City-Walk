import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  setCurrentSession,
  startAdminSession,
  startDemoSession,
} from '../../src/services/session-client.js';

afterEach(() => {
  vi.unstubAllGlobals();
  setCurrentSession(null);
});

describe('session client', () => {
  it('keeps demo mode usable when the session API is offline', async () => {
    const values = new Map();
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => values.get(key) || null),
      setItem: vi.fn((key, value) => values.set(key, value)),
      removeItem: vi.fn((key) => values.delete(key)),
    });
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    const session = await startDemoSession();

    expect(session).toMatchObject({
      authenticated: true,
      role: 'demo',
      progressNamespace: 'demo',
      localOnly: true,
    });
    expect(session.allowedUI).toContain('trails');
  });

  it('preserves backend error codes and request ids', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: {
        get(name) {
          return name === 'X-Request-Id' ? 'req-admin' : null;
        },
      },
      json: () => Promise.resolve({
        code: 'INVALID_ADMIN_PASSWORD',
        error: 'Invalid admin password.',
      }),
    }));

    await expect(startAdminSession('wrong')).rejects.toMatchObject({
      code: 'INVALID_ADMIN_PASSWORD',
      status: 401,
      requestId: 'req-admin',
      message: 'Invalid admin password.',
    });
  });
});
