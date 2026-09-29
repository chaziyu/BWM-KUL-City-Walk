import { describe, expect, it, vi } from 'vitest';
import { buildGoogleMapsUrls } from '../src/utils/google-maps.js';
import { debounce } from '../src/utils/debounce.js';
import { getScopedKey } from '../src/services/storage.js';

describe('scoped storage keys', () => {
  it('separates demo progress from visitor progress', () => {
    expect(getScopedKey('visited', 'demo')).toBe('jejak_demo_visited');
    expect(getScopedKey('visited', 'visitor')).toBe('jejak_visitor_visited');
  });

  it('keeps admin separate and falls back unknown modes to visitor', () => {
    expect(getScopedKey('visited', 'admin')).toBe('jejak_admin_visited');
    expect(getScopedKey('visited', 'unknown')).toBe('jejak_visitor_visited');
  });
});

describe('Google Maps URL builder', () => {
  it('builds walking directions URLs', () => {
    const urls = buildGoogleMapsUrls(3.1484, 101.6947, 'walk');
    const external = new URL(urls.externalUrl);

    expect(urls.kind).toBe('route');
    expect(external.pathname).toBe('/maps/dir/');
    expect(external.searchParams.get('api')).toBe('1');
    expect(external.searchParams.get('destination')).toBe('3.1484,101.6947');
    expect(external.searchParams.get('travelmode')).toBe('walking');
    expect(urls.embedUrl).toContain('dirflg=w');
  });

  it('builds keyless restaurant search URLs centered on the site', () => {
    const urls = buildGoogleMapsUrls(3.1484, 101.6947, 'restaurants');
    const external = new URL(urls.externalUrl);

    expect(urls.kind).toBe('search');
    expect(external.pathname).toBe('/maps/search/');
    expect(external.searchParams.get('api')).toBe('1');
    expect(external.searchParams.get('query')).toBe('restaurants near 3.1484,101.6947');
    expect(urls.embedUrl).toBeNull();
  });

  it('builds keyless hotel search URLs centered on the site', () => {
    const urls = buildGoogleMapsUrls(3.1484, 101.6947, 'hotels');
    const external = new URL(urls.externalUrl);

    expect(external.searchParams.get('query')).toBe('hotels near 3.1484,101.6947');
    expect(urls.embedUrl).toBeNull();
  });

  it('rejects invalid coordinates and unsupported modes', () => {
    expect(() => buildGoogleMapsUrls(91, 101.6947, 'restaurants')).toThrow('Invalid latitude coordinate');
    expect(() => buildGoogleMapsUrls(3.1484, 181, 'hotels')).toThrow('Invalid longitude coordinate');
    expect(() => buildGoogleMapsUrls(3.1484, 101.6947, 'banana')).toThrow('Unsupported Google Maps mode');
  });
});

describe('debounce', () => {
  it('runs only the latest call after the wait period', () => {
    vi.useFakeTimers();
    const callback = vi.fn();
    const debounced = debounce(callback, 200);

    debounced('first');
    debounced('second');
    vi.advanceTimersByTime(199);

    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenCalledWith('second');

    vi.useRealTimers();
  });
});
