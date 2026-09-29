import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { buildPrompt } = require('../../api/_shared/ai/build-prompt.js');
const { getSiteById } = require('../../api/_shared/ai/site-catalog.js');
const { retrieveSites } = require('../../api/_shared/ai/retrieve-sites.js');

describe('buildPrompt', () => {
  it('site prompt contains one structured verified fact packet', () => {
    const prompt = buildPrompt([getSiteById('1')]);

    expect(prompt.match(/<site /g)).toHaveLength(1);
    expect(prompt).toContain('Bangunan Sultan Abdul Samad');
    expect(prompt).toContain('<built>1894-1897</built>');
    expect(prompt).toContain('<architects>A.C. Norman, R.A.J. Bidwell, A.B. Hubback</architects>');
    expect(prompt).toContain('<ticket_fee>Free (Exterior)</ticket_fee>');
    expect(prompt).toContain('Use only the verified site fields below.');
    expect(prompt).not.toContain('Old Post Office');
  });

  it('general prompt keeps one to three sites and stays compact', () => {
    const prompt = buildPrompt(retrieveSites('Which sites are near Merdeka Square?'));

    expect(prompt.match(/<site /g).length).toBeGreaterThan(0);
    expect(prompt.match(/<site /g).length).toBeLessThanOrEqual(3);
    expect(prompt.length).toBeLessThan(6000);
  });
});
