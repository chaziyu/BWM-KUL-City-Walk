import { describe, expect, it } from 'vitest';
import { ApiError, parseApiResponse } from '../../src/services/api-client.js';

function response({ ok, status = 200, body = {}, requestId = null }) {
  return {
    ok,
    status,
    headers: {
      get(name) {
        return name.toLowerCase() === 'x-request-id' ? requestId : null;
      },
    },
    json: () => Promise.resolve(body),
  };
}

describe('API client', () => {
  it('returns successful JSON responses', async () => {
    await expect(parseApiResponse(response({
      ok: true,
      body: { success: true },
    }))).resolves.toEqual({ success: true });
  });

  it('preserves structured error code, status, request id and body', async () => {
    await expect(parseApiResponse(response({
      ok: false,
      status: 429,
      requestId: 'req-123',
      body: { code: 'RATE_LIMITED', error: 'Try later', remainingQuota: 0 },
    }))).rejects.toMatchObject({
      name: 'ApiError',
      code: 'RATE_LIMITED',
      status: 429,
      requestId: 'req-123',
      message: 'Try later',
      data: { remainingQuota: 0 },
    });
  });

  it('exports a dedicated API error type', () => {
    expect(new ApiError('x')).toBeInstanceOf(Error);
  });
});
