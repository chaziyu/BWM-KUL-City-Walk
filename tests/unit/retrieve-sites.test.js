import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { normalizeText, retrieveSites } = require('../../api/_shared/ai/retrieve-sites.js');

describe('retrieveSites', () => {
  it('retrieves by exact site name', () => {
    expect(retrieveSites('Tell me about Bangunan Sultan Abdul Samad').map(site => site.id)[0]).toBe('1');
  });

  it('retrieves Site 1 by verified English alias', () => {
    expect(retrieveSites('Who designed Sultan Abdul Samad Building?').map(site => site.id)[0]).toBe('1');
  });

  it('returns up to three sites for broad trail phrasing', () => {
    const results = retrieveSites('Which must-visit sites should I start with on this walk?');

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('returns zero sites for weak or unrelated questions', () => {
    expect(retrieveSites('Can you recommend stock investments for this week?')).toEqual([]);
    expect(retrieveSites('Who designed it?')).toEqual([]);
  });

  it('normalizes punctuation and case', () => {
    expect(normalizeText('  P.H. Hendry Royal Jewellers! ')).toBe('p h hendry royal jewellers');
  });
});
