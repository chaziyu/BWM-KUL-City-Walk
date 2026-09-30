import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { CARTO_POSITRON_URL } from '../../src/features/map/basemap.js';

const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
const csp = vercelConfig.headers[0].headers.find(
  (header) => header.key === 'Content-Security-Policy',
).value;

function cspSourceForTileTemplate(template) {
  const sampleUrl = template
    .replace('{s}', 'a')
    .replace('{z}', '16')
    .replace('{x}', '51600')
    .replace('{y}', '32600')
    .replace('{r}', '');
  const url = new URL(sampleUrl);
  const wildcardHost = url.hostname.replace(/^[^.]+\./, '*.');
  return `${url.protocol}//${wildcardHost}`;
}

describe('production CSP', () => {
  it('allows the configured CARTO basemap image host and no stale map providers', () => {
    const cartoSource = cspSourceForTileTemplate(CARTO_POSITRON_URL);

    expect(cartoSource).toBe('https://*.basemaps.cartocdn.com');
    expect(csp).toContain(
      `img-src 'self' data: ${cartoSource} https://fonts.gstatic.com https://www.gstatic.com`,
    );
    expect(csp).not.toContain('tiles.openfreemap.org');
    expect(csp).not.toContain('tile.openstreetmap.org');
    expect(csp).not.toContain('img-src *');
  });

  it('does not add the raster tile host to connect-src', () => {
    expect(csp).toContain(
      "connect-src 'self' https://translate.googleapis.com https://translate-pa.googleapis.com",
    );
    expect(csp).not.toContain(
      "connect-src 'self' https://*.basemaps.cartocdn.com",
    );
  });

  it('allows only the configured Google Translate and Maps frame origins', () => {
    expect(csp).toContain('script-src');
    expect(csp).toContain('https://translate.google.com');
    expect(csp).toContain('https://translate.googleapis.com');
    expect(csp).toContain('https://translate-pa.googleapis.com');
    expect(csp).toContain('https://www.gstatic.com');
    expect(csp).toContain(
      'frame-src https://translate.google.com https://maps.google.com https://www.google.com',
    );
  });
});
