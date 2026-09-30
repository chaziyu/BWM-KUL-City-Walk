/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createPolygonRenderer } from '../../src/features/map/polygon-renderer.js';

function createLayer() {
  const layers = [];
  return {
    layers,
    addLayer(layer) {
      layers.push(layer);
    },
    clearLayers() {
      layers.length = 0;
    },
  };
}

describe('polygon renderer', () => {
  it('renders heritage polygons once with the migrated class', () => {
    const layer = createLayer();
    const renderer = createPolygonRenderer({
      L: {
        polygon: vi.fn((coords, options) => ({
          coords,
          options,
          bindPopup: vi.fn(),
          on: vi.fn(),
          setStyle: vi.fn(),
        })),
      },
      polygonsLayer: layer,
      onSiteDetails: vi.fn(),
      onSiteSelected: vi.fn(),
      getIsCompleted: () => false,
      getSiteColors: () => ({ markerColor: '#111', fillColor: '#eee' }),
      visitedColor: '#007bff',
      polygonOpacity: 0.2,
    });

    const sites = [{ id: '1', coordinates: { polygon: [[3, 101], [3, 102], [4, 102]] } }];
    renderer.render(sites);
    renderer.render(sites);

    expect(layer.layers).toHaveLength(1);
    expect(renderer.getPolygons()['1'].options.className).toBe('heritage-polygon');
  });

  it('uses the configured low base opacity and emphasizes an opened site', () => {
    const layer = createLayer();
    const polygon = {
      handlers: {},
      bindPopup: vi.fn(),
      on(event, handler) {
        this.handlers[event] = handler;
      },
      setStyle: vi.fn(),
    };
    const renderer = createPolygonRenderer({
      L: { polygon: vi.fn(() => polygon) },
      polygonsLayer: layer,
      onSiteDetails: vi.fn(),
      onSiteSelected: vi.fn(),
      getIsCompleted: () => false,
      getSiteColors: () => ({ markerColor: '#9A642F', fillColor: '#E9D7BD' }),
      visitedColor: '#2F7D5A',
      selectedColor: '#172A3A',
      polygonOpacity: 0.2,
    });
    const site = { id: '1', coordinates: { polygon: [[3, 101], [3, 102], [4, 102]] } };

    renderer.render([site]);

    expect(polygon.setStyle).toHaveBeenCalledWith(expect.objectContaining({
      fillOpacity: 0.2,
      color: '#9A642F',
    }));

    polygon.handlers.popupopen();

    expect(polygon.setStyle).toHaveBeenLastCalledWith(expect.objectContaining({
      color: '#172A3A',
      fillOpacity: 0.34,
      weight: 3,
    }));
  });

  it('routes polygon clicks through site selection', () => {
    const layer = createLayer();
    const onSiteSelected = vi.fn();
    const polygon = {
      handlers: {},
      bindPopup: vi.fn(),
      on(event, handler) {
        this.handlers[event] = handler;
      },
      setStyle: vi.fn(),
    };
    const renderer = createPolygonRenderer({
      L: { polygon: vi.fn(() => polygon) },
      polygonsLayer: layer,
      onSiteDetails: vi.fn(),
      onSiteSelected,
      getIsCompleted: () => false,
      getSiteColors: () => ({ markerColor: '#111', fillColor: '#eee' }),
      visitedColor: '#007bff',
      polygonOpacity: 0.2,
    });
    const site = { id: '1', coordinates: { polygon: [[3, 101], [3, 102], [4, 102]] } };

    renderer.render([site]);
    polygon.handlers.click();

    expect(onSiteSelected).toHaveBeenCalledWith(site);
  });

  it('binds site info as polygon popup text', () => {
    const layer = createLayer();
    const polygon = {
      bindPopup: vi.fn(function (content) {
        this.popupContent = content;
        return this;
      }),
      on: vi.fn(),
      setStyle: vi.fn(),
    };
    const renderer = createPolygonRenderer({
      L: { polygon: vi.fn(() => polygon) },
      polygonsLayer: layer,
      onSiteDetails: vi.fn(),
      onSiteSelected: vi.fn(),
      getIsCompleted: () => false,
      getSiteColors: () => ({ markerColor: '#111', fillColor: '#eee' }),
      visitedColor: '#007bff',
      polygonOpacity: 0.2,
    });
    const site = {
      id: '1',
      name: 'Site',
      info: 'Brief info',
      coordinates: { polygon: [[3, 101], [3, 102], [4, 102]] },
    };

    renderer.render([site]);

    expect(polygon.bindPopup).toHaveBeenCalledOnce();
    expect(String(polygon.popupContent.textContent || polygon.popupContent)).toContain('Site');
    expect(String(polygon.popupContent.textContent || polygon.popupContent)).toContain('Brief info');
  });

  it('opens site details from popup button', () => {
    const layer = createLayer();
    const onSiteDetails = vi.fn();
    const polygon = {
      bindPopup: vi.fn(function (content) {
        this.popupContent = content;
        return this;
      }),
      on: vi.fn(),
      setStyle: vi.fn(),
    };
    const renderer = createPolygonRenderer({
      L: { polygon: vi.fn(() => polygon) },
      polygonsLayer: layer,
      onSiteDetails,
      onSiteSelected: vi.fn(),
      getIsCompleted: () => false,
      getSiteColors: () => ({ markerColor: '#111', fillColor: '#eee' }),
      visitedColor: '#007bff',
      polygonOpacity: 0.2,
    });
    const site = {
      id: '1',
      name: 'Site',
      info: 'Brief info',
      coordinates: { polygon: [[3, 101], [3, 102], [4, 102]] },
    };

    renderer.render([site]);
    polygon.popupContent.querySelector('button').click();

    expect(onSiteDetails).toHaveBeenCalledWith(site);
  });
});
