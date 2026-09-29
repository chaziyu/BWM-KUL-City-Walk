import { describe, expect, it, vi } from 'vitest';
import { createChatService } from '../../src/features/chat/chat-service.js';

describe('chat service', () => {
  it('sends chat context to the server', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: 'ok' }),
    });
    const service = createChatService({ deviceId: 'device-1', fetchImpl });

    await service.send({
      userQuery: 'Who designed this building?',
      context: { type: 'site', siteId: '1' },
      history: [],
    });

    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toEqual({
      userQuery: 'Who designed this building?',
      context: { type: 'site', siteId: '1' },
      history: [],
    });
  });
  it('does not invent a zero quota when an error omits remainingQuota', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      headers: { get: () => 'req-session' },
      json: () => Promise.resolve({ code: 'AUTH_REQUIRED', reply: 'Session expired' }),
    });
    const service = createChatService({ deviceId: 'device-1', fetchImpl });

    await expect(service.send({ userQuery: 'Hello', context: {}, history: [] }))
      .rejects.toMatchObject({
        message: 'Session expired',
        status: 401,
        code: 'AUTH_REQUIRED',
        requestId: 'req-session',
      });
    try {
      await service.send({ userQuery: 'Hello', context: {}, history: [] });
    } catch (error) {
      expect(Object.hasOwn(error, 'remainingQuota')).toBe(false);
    }
  });

  it('preserves an explicit zero remaining quota', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ reply: 'Quota reached', remainingQuota: 0 }),
    });
    const service = createChatService({ deviceId: 'device-1', fetchImpl });

    await expect(service.send({ userQuery: 'Hello', context: {}, history: [] }))
      .rejects.toMatchObject({ remainingQuota: 0, status: 429 });
  });
});
