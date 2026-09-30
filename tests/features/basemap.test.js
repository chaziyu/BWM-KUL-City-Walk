import { describe, expect, it, vi } from 'vitest';
import {
  CARTO_POSITRON_ATTRIBUTION,
  CARTO_POSITRON_URL,
  createCartoPositronLayer,
} from '../../src/features/map/basemap.js';

describe('CARTO Positron basemap', () => {
  it('creates a free-keyless Leaflet tile layer with required attribution', () => {
    const layer = { addTo: vi.fn() };
    const tileLayer = vi.fn(() => layer);

    expect(createCartoPositronLayer({ tileLayer })).toBe(layer);
    expect(tileLayer).toHaveBeenCalledWith(
      CARTO_POSITRON_URL,
      expect.objectContaining({
        attribution: CARTO_POSITRON_ATTRIBUTION,
        maxZoom: 20,
        opacity: 0.96,
        subdomains: 'abcd',
      }),
    );
    expect(CARTO_POSITRON_URL).toContain('basemaps.cartocdn.com/light_all');
    expect(CARTO_POSITRON_ATTRIBUTION).toContain('OpenStreetMap');
    expect(CARTO_POSITRON_ATTRIBUTION).toContain('CARTO');
  });

  it('fails clearly when Leaflet is unavailable', () => {
    expect(() => createCartoPositronLayer(null)).toThrow(/Leaflet tileLayer/);
  });
});
