import { describe, expect, it, vi } from 'vitest';
import { registerServiceWorker } from '../../src/services/pwa.js';

describe('PWA registration', () => {
  it('registers the same-origin service worker when enabled', async () => {
    const register = vi.fn().mockResolvedValue({ scope: '/' });

    const result = await registerServiceWorker({
      navigatorImpl: { serviceWorker: { register } },
      enabled: true,
    });

    expect(register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(result).toEqual({ scope: '/' });
  });

  it('does nothing when service workers are unavailable', async () => {
    expect(await registerServiceWorker({ navigatorImpl: {}, enabled: true })).toBeNull();
  });
});
