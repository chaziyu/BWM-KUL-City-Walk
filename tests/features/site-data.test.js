import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadSiteData, resetSiteCache } from '../../src/features/sites/site-data.js';

describe('site data loader', () => {
  beforeEach(() => {
    resetSiteCache();
    vi.restoreAllMocks();
  });

  it('rejects with error when sites.json returns HTTP 500', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await expect(loadSiteData()).rejects.toThrow('Failed to load sites: 500 Internal Server Error');
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('performs a fresh fetch on the second request if the first request fails', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: 100, category: 'must_visit', name: 'Site A' }])
      });

    await expect(loadSiteData()).rejects.toThrow('Failed to load sites');

    const sites = await loadSiteData();
    expect(sites).toEqual([{ id: '100', category: 'must_visit', name: 'Site A' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects on invalid JSON response and permits retrying', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve('not an array')
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([{ id: '200', category: 'recommended', name: 'Site B' }])
      });

    await expect(loadSiteData()).rejects.toThrow('Fetched sites data must be an array');

    const sites = await loadSiteData();
    expect(sites).toEqual([{ id: '200', category: 'recommended', name: 'Site B' }]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
