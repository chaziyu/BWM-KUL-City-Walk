import { describe, expect, it } from 'vitest';
import { getDirectionsUrls } from '../../src/features/directions/directions-service.js';

describe('directions service', () => {
  const site = {
    name: 'Masjid Jamek',
    coordinates: { marker: [3.1489, 101.6956] },
  };

  it('builds route URLs with destination and travel mode', () => {
    const urls = getDirectionsUrls(site, 'directions');
    expect(urls.externalUrl).toContain('destination=3.1489,101.6956');
    expect(urls.externalUrl).toContain('travelmode=transit');
  });

  it('builds nearby search URLs', () => {
    const urls = getDirectionsUrls(site, 'restaurants');
    expect(urls.externalUrl).toContain('/search/restaurants/@3.1489,101.6956');
  });
});
