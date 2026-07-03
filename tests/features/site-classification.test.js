import { describe, expect, it } from 'vitest';
import { isMainSite } from '../../src/features/sites/site-classification.js';

describe('isMainSite classification helper', () => {
  it('identifies must_visit sites as main sites regardless of ID format', () => {
    expect(isMainSite({ id: 'SAS-01', category: 'must_visit' })).toBe(true);
    expect(isMainSite({ id: '100', category: 'must_visit' })).toBe(true);
    expect(isMainSite({ id: 123, category: 'must_visit' })).toBe(true);
  });

  it('filters out non-must_visit categories', () => {
    expect(isMainSite({ id: 'SAS-01', category: 'recommended' })).toBe(false);
    expect(isMainSite({ id: '100', category: '' })).toBe(false);
    expect(isMainSite({ id: '100', category: null })).toBe(false);
    expect(isMainSite({ id: '100' })).toBe(false);
  });

  it('handles null/undefined inputs safely', () => {
    expect(isMainSite(null)).toBe(false);
    expect(isMainSite(undefined)).toBe(false);
  });
});
