import { describe, expect, it } from 'vitest';
import { getMustVisitSites, isMustVisitSite } from '../../src/features/sites/site-domain.js';

describe('site domain classification', () => {
  it('uses category rather than id shape', () => {
    const sites = [
      { id: 'A', category: 'must_visit' },
      { id: '1', category: 'recommended' },
    ];

    expect(isMustVisitSite(sites[0])).toBe(true);
    expect(isMustVisitSite(sites[1])).toBe(false);
    expect(getMustVisitSites(sites)).toEqual([sites[0]]);
  });
});
