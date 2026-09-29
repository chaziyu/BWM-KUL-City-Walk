import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  setCurrentSession,
  startAdminSession,
} from '../../src/services/session-client.js';

afterEach(() => {
  vi.unstubAllGlobals();
  setCurrentSession(null);
});

describe('session client', () => {
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
