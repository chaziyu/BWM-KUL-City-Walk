import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildPrompt } = require('../../api/_shared/ai/build-prompt.js');
const { getSiteById } = require('../../api/_shared/ai/site-catalog.js');
const { retrieveSites } = require('../../api/_shared/ai/retrieve-sites.js');

describe('buildPrompt', () => {
  it('site prompt contains one site', () => {
    const prompt = buildPrompt([getSiteById('1')]);

    expect(prompt.match(/<site /g)).toHaveLength(1);
    expect(prompt).toContain('Bangunan Sultan Abdul Samad');
    expect(prompt).not.toContain('Old Post Office');
  });

  it('general prompt contains one to three retrieved sites and is smaller than baseline', () => {
    const prompt = buildPrompt(retrieveSites('Which sites are near Merdeka Square?'));

    expect(prompt.match(/<site /g).length).toBeGreaterThan(0);
    expect(prompt.match(/<site /g).length).toBeLessThanOrEqual(3);
    expect(prompt.length).toBeLessThan(20643);
  });
});
