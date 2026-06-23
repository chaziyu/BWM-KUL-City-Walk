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
});
