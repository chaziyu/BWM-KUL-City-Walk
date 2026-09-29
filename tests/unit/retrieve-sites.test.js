import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  getRetrievalConfidence,
  normalizeText,
  retrieveSiteMatches,
  retrieveSites,
} = require('../../api/_shared/ai/retrieve-sites.js');

describe('retrieveSites', () => {
  it('retrieves by exact site name', () => {
    expect(retrieveSites('Tell me about Bangunan Sultan Abdul Samad').map(site => site.id)).toEqual(['1']);
  });

  it('retrieves Site 1 by verified English alias', () => {
    expect(retrieveSites('Who designed Sultan Abdul Samad Building?').map(site => site.id)).toEqual(['1']);
  });

  it('resolves Chinese aliases without stripping Han characters', () => {
    expect(normalizeText('  独立广场有什么历史？ ')).toBe('独立广场有什么历史');
    expect(retrieveSites('独立广场有什么历史？').map(site => site.id)).toEqual(['A']);
    expect(retrieveSites('谁设计了占美清真寺？').map(site => site.id)).toEqual(['4']);
  });

  it('retrieves Malay aliases', () => {
    expect(retrieveSites('Apakah sejarah Pejabat Pos Lama?').map(site => site.id)[0]).toBe('2');
  });

  it('returns up to three sites when a multi-site query has verified lexical matches', () => {
    const results = retrieveSites('Which sites are near Merdeka Square?');

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('keeps multiple candidates for comparative questions', () => {
    const results = retrieveSites('Which buildings near Merdeka Square should I compare?');

    expect(results.length).toBeGreaterThan(1);
    expect(results.length).toBeLessThanOrEqual(3);
  });

  it('returns zero sites for weak or unrelated questions', () => {
    expect(retrieveSites('Can you recommend stock investments for this week?')).toEqual([]);
    expect(retrieveSites('Who designed it?')).toEqual([]);
  });

  it('derives retrieval confidence server-side', () => {
    expect(getRetrievalConfidence(retrieveSiteMatches('Tell me about Masjid Jamek'))).toBe('high');
    expect(getRetrievalConfidence([], 'general')).toBe('low');
    expect(getRetrievalConfidence([], 'site')).toBe('high');
  });

  it('normalizes punctuation, case, and accents', () => {
    expect(normalizeText('  P.H. Hendry Royal Jewellers! ')).toBe('p h hendry royal jewellers');
  });
});
