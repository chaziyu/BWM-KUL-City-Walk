/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createMapController } from '../../src/features/map/map-controller.js';

function createLayer() {
  const layers = new Set();
  return {
    addLayer: (layer) => layers.add(layer),
    addTo(map) {
      map.addLayer(this);
      return this;
    },
    clearLayers: () => layers.clear(),
    hasLayer: (layer) => layers.has(layer),
    removeLayer: (layer) => layers.delete(layer),
    layers,
  };
}

describe('map controller', () => {
  function setup(zoom) {
    const mapLayers = new Set();
    const map = {
      addLayer: (layer) => mapLayers.add(layer),
      getZoom: () => zoom,
      hasLayer: (layer) => mapLayers.has(layer),
      locate: vi.fn(),
      off: vi.fn(),
      on: vi.fn(),
      remove: vi.fn(),
      removeLayer: (layer) => mapLayers.delete(layer),
      setView: vi.fn(() => map),
      stopLocate: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
    };
    const groups = [];
    const markers = [];
    const polygons = [];
    const L = {
      layerGroup: vi.fn(() => {
        const layer = createLayer();
        groups.push(layer);
        return layer;
      }),
      map: vi.fn(() => map),
      circle: vi.fn(() => ({
        addTo: vi.fn(() => ({ remove: vi.fn(), setLatLng: vi.fn() })),
      })),
      divIcon: vi.fn((options) => options),
      marker: vi.fn(() => ({
        addTo: vi.fn(() => ({ remove: vi.fn(), setLatLng: vi.fn() })),
        bindPopup() {
          return this;
        },
        bindTooltip() {
          return this;
        },
        on: vi.fn(),
        options: {},
      })),
      polygon: vi.fn(() => {
        const polygon = { bindPopup: vi.fn(), on: vi.fn(), setStyle: vi.fn() };
        polygons.push(polygon);
        return polygon;
      }),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    };
    L.marker.mockImplementation(() => {
      const marker = {
        addTo: vi.fn(() => ({ remove: vi.fn(), setLatLng: vi.fn() })),
        bindPopup() {
          return this;
        },
        bindTooltip() {
          return this;
        },
        on: vi.fn(),
        options: {},
      };
      markers.push(marker);
      return marker;
    });
    const sites = [{
      id: '1',
      category: 'must_visit',
      coordinates: {
        marker: [3, 101],
        polygon: [[3, 101], [3, 102], [4, 102]],
      },
    }, {
      id: 'A',
      category: 'recommended',
      coordinates: {
        marker: [3, 101],
        polygon: [[3, 101], [3, 102], [4, 102]],
      },
    }];

    const controller = createMapController({
      L,
      loadSites: () => Promise.resolve(sites),
      getIsCompleted: () => false,
      onSiteSelected: vi.fn(),
    });

    return { controller, groups, mapLayers, markers, polygons };
  }

  it('shows filtered markers below the polygon threshold', async () => {
    const { controller, groups, mapLayers, markers } = setup(15);

    await controller.initMap();

    expect(mapLayers.has(groups[0])).toBe(true);
    expect(mapLayers.has(groups[1])).toBe(false);
    expect(groups[0].layers.size).toBe(1);
    expect(groups[0].layers.has(markers[0])).toBe(true);

    controller.setFilterMode('recommended');

    expect(groups[0].layers.size).toBe(1);
    expect(groups[0].layers.has(markers[1])).toBe(true);
  });

  it('shows filtered polygons at the polygon threshold', async () => {
    const { controller, groups, mapLayers, polygons } = setup(16);

    await controller.initMap();

    expect(mapLayers.has(groups[0])).toBe(false);
    expect(mapLayers.has(groups[1])).toBe(true);
    expect(groups[1].layers.size).toBe(1);
    expect(groups[1].layers.has(polygons[0])).toBe(true);

    controller.setFilterMode('recommended');

    expect(groups[1].layers.size).toBe(1);
    expect(groups[1].layers.has(polygons[1])).toBe(true);
  });

  it('exposes map zoom controls for custom plus and minus buttons', async () => {
    const { controller } = setup(16);

    const map = await controller.initMap();
    controller.zoomIn();
    controller.zoomOut();

    expect(map.zoomIn).toHaveBeenCalledOnce();
    expect(map.zoomOut).toHaveBeenCalledOnce();
  });
});
