import { describe, expect, it, vi } from 'vitest';
import { createMarkerRenderer } from '../../src/features/map/marker-renderer.js';

describe('marker renderer', () => {
  it('routes marker clicks through site selection', () => {
    const onSiteSelected = vi.fn();
    const marker = {
      handlers: {},
      bindTooltip() {
        return this;
      },
      on(event, handler) {
        this.handlers[event] = handler;
      },
      options: {},
    };
    const site = { id: '1', name: 'Site', coordinates: { marker: [3, 101] } };

    createMarkerRenderer({
      L: { marker: vi.fn(() => marker) },
      markersLayer: { addLayer: vi.fn() },
      onSiteSelected,
      getIsCompleted: () => false,
    }).render([site]);
    marker.handlers.click();

    expect(onSiteSelected).toHaveBeenCalledWith(site);
  });
});
