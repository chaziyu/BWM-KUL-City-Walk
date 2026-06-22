import { describe, expect, it } from 'vitest';
import { createMapFilter } from '../../src/features/map/map-filter.js';

describe('Map Logic', () => {
  it('updates marker visibility when filter changes', () => {
    const sites = [
      { id: '1', category: 'must_visit' },
      { id: 'A', category: 'recommended' },
    ];
    const filter = createMapFilter();

    expect(filter.getVisibleSites(sites).map((site) => site.id)).toEqual(['1']);
    filter.setMode('recommended');
    expect(filter.getVisibleSites(sites).map((site) => site.id)).toEqual(['A']);
  });
});
