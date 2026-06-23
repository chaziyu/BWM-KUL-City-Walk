import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getSiteById, knowledgeVersion, siteById, sites } = require('../../api/_shared/ai/site-catalog.js');

describe('site catalog', () => {
  it('returns one clean verified site by id', () => {
    const site = getSiteById('1');

    expect(site).toMatchObject({
      id: '1',
      name: 'Bangunan Sultan Abdul Samad',
      category: 'must_visit',
    });
    expect(site.searchTerms).toContain('Sultan Abdul Samad Building');
    expect(site.aiContext).toContain('Bangunan Sultan Abdul Samad');
    expect(site.searchableText).toContain('clock tower');
    expect(site.image).toBeUndefined();
    expect(site.coordinates).toBeUndefined();
    expect(site.quiz).toBeUndefined();
  });

  it('builds lookup and version from server data', () => {
    expect(sites).toHaveLength(24);
    expect(siteById['1']).toBe(getSiteById('1'));
    expect(knowledgeVersion).toMatch(/^[a-f0-9]{12}$/);
    expect(getSiteById('missing')).toBeNull();
  });
});
