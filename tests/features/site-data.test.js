/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('site data loading', () => {
  it('allows a retry after a failed fetch', async () => {
    vi.resetModules();
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: vi.fn(),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue([{ id: 1, name: 'Site' }]),
      });
    vi.stubGlobal('fetch', fetchMock);

    const { loadSiteData } = await import('../../src/features/sites/site-data.js');

    await expect(loadSiteData()).rejects.toThrow('HTTP 503');
    await expect(loadSiteData()).resolves.toEqual([{ id: '1', name: 'Site' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
