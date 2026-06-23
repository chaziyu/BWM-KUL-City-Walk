import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const csp = vercelConfig.headers[0].headers.find((header) => header.key === 'Content-Security-Policy').value;

describe('production CSP', () => {
  it('allows CARTO map tiles without broad img-src wildcards', () => {
    expect(csp).toContain("img-src 'self' data: https://*.tile.openstreetmap.org https://*.basemaps.cartocdn.com");
    expect(csp).not.toContain('img-src *');
  });

  it('allows only the configured Google Translate and Maps frame origins', () => {
    expect(csp).toContain('script-src');
    expect(csp).toContain('https://translate.google.com');
    expect(csp).toContain('connect-src \'self\' https://translate.googleapis.com');
    expect(csp).toContain('frame-src https://translate.google.com https://maps.google.com https://www.google.com');
  });
});
