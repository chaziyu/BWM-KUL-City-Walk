import { describe, expect, it, vi } from 'vitest';
import { buildGoogleMapsUrls } from '../src/utils/google-maps.js';
import { debounce } from '../src/utils/debounce.js';
import { getScopedKey } from '../storage.js';

describe('scoped storage keys', () => {
  it('separates demo progress from visitor progress', () => {
    expect(getScopedKey('visited', 'demo')).toBe('jejak_demo_visited');
    expect(getScopedKey('visited', 'visitor')).toBe('jejak_visitor_visited');
  });

  it('falls back to the visitor namespace for unknown modes', () => {
    expect(getScopedKey('visited', 'admin')).toBe('jejak_visitor_visited');
  });
});

describe('Google Maps URL builder', () => {
  it('builds walking directions URLs', () => {
    const urls = buildGoogleMapsUrls(3.1484, 101.6947, 'walk');

    expect(urls.externalUrl).toContain('travelmode=walking');
    expect(urls.embedUrl).toContain('dirflg=w');
  });

  it('builds nearby restaurant search URLs centered on the site', () => {
    const urls = buildGoogleMapsUrls(3.1484, 101.6947, 'restaurants');

    expect(urls.externalUrl).toContain('/search/restaurants/@3.1484,101.6947,16z');
    expect(urls.embedUrl).toContain('sll=3.1484,101.6947');
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
