import { describe, expect, it } from 'vitest';
import { createMapFilter } from '../../src/features/map/map-filter.js';

describe('map filter', () => {
  const sites = [
    { id: '1', category: 'must_visit' },
    { id: 'A', category: 'recommended' },
    { id: '2', category: 'must_visit' },
  ];

  it('defaults to must_visit filtering', () => {
    const filter = createMapFilter();
    expect(filter.getVisibleSites(sites).map((site) => site.id)).toEqual(['1', '2']);
  });

  it('switches to recommended filtering', () => {
    const filter = createMapFilter();
    filter.setMode('recommended');
    expect(filter.getVisibleSites(sites).map((site) => site.id)).toEqual(['A']);
  });
});
