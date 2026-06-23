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
});
