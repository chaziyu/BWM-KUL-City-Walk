/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createGeolocationController } from '../../src/features/map/geolocation.js';

function setup() {
  const handlers = {};
  const userMarker = {
    _icon: null,
    remove: vi.fn(),
    setLatLng: vi.fn(),
  };
  const userCircle = {
    remove: vi.fn(),
    setLatLng: vi.fn().mockReturnThis(),
    setRadius: vi.fn().mockReturnThis(),
  };
  const map = {
    locate: vi.fn(),
    off: vi.fn(),
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    stopLocate: vi.fn(),
  };
  const L = {
    circle: vi.fn(() => ({ addTo: vi.fn(() => userCircle) })),
    divIcon: vi.fn(() => ({})),
    marker: vi.fn(() => ({ addTo: vi.fn(() => userMarker) })),
  };
  const onStatus = vi.fn();

  const controller = createGeolocationController({
    L,
    map,
    getMainSites: () => [],
    isCompleted: () => false,
    onStatus,
  });

  return { controller, handlers, map, onStatus };
}

describe('geolocation controller', () => {
  it('stops watching and explains permission denial', () => {
    const { controller, handlers, map, onStatus } = setup();

    handlers.locationerror({ code: 1 });

    expect(map.stopLocate).toHaveBeenCalledOnce();
    expect(onStatus).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warning' }));
    controller.destroy();
  });

  it('retries one timeout at lower accuracy then stops', () => {
    const { controller, handlers, map, onStatus } = setup();

    handlers.locationerror({ code: 3 });
    expect(map.locate).toHaveBeenLastCalledWith(expect.objectContaining({
      enableHighAccuracy: false,
      timeout: 10000,
    }));

    handlers.locationerror({ code: 3 });
    expect(map.stopLocate).toHaveBeenCalledOnce();
    expect(onStatus).toHaveBeenLastCalledWith(expect.objectContaining({ severity: 'warning' }));
    controller.destroy();
  });
});
