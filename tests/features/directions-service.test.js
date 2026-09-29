import { describe, expect, it } from 'vitest';
import { getDirectionsUrls } from '../../src/features/directions/directions-service.js';

describe('directions service', () => {
  const site = {
    name: 'Masjid Jamek',
    coordinates: { marker: [3.1489, 101.6956] },
  };

  it('builds route URLs with destination and travel mode', () => {
    const urls = getDirectionsUrls(site, 'directions');
    expect(urls.kind).toBe('route');
    expect(urls.externalUrl).toContain('destination=3.1489%2C101.6956');
    expect(urls.externalUrl).toContain('travelmode=transit');
  });

  it('builds restaurant and hotel searches around the site', () => {
    const restaurants = new URL(getDirectionsUrls(site, 'restaurants').externalUrl);
    const hotels = new URL(getDirectionsUrls(site, 'hotels').externalUrl);

    expect(restaurants.searchParams.get('query')).toBe('restaurants near 3.1489,101.6956');
    expect(hotels.searchParams.get('query')).toBe('hotels near 3.1489,101.6956');
  });

  it('rejects sites without a valid coordinate pair', () => {
    expect(() => getDirectionsUrls({ name: 'Broken Site' }, 'restaurants'))
      .toThrow('This site does not have valid map coordinates.');

    expect(() => getDirectionsUrls({
      name: 'Broken Site',
      coordinates: { marker: [3.1] },
    }, 'hotels')).toThrow('This site does not have valid map coordinates.');
  });
});
