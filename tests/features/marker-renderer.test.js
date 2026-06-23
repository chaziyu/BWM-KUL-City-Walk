import { describe, expect, it, vi } from 'vitest';
import { createMarkerRenderer } from '../../src/features/map/marker-renderer.js';

describe('marker renderer', () => {
  it('routes marker clicks through site selection', () => {
    const onSiteSelected = vi.fn();
    const marker = {
      handlers: {},
      popupContent: null,
      bindPopup(content) {
        this.popupContent = content;
        return this;
      },
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

  it('binds site info as marker popup text', () => {
    const marker = {
      bindPopup: vi.fn(function (content) {
        this.popupContent = content;
        return this;
      }),
      bindTooltip() {
        return this;
      },
      on: vi.fn(),
      options: {},
    };
    const site = { id: '1', name: 'Site', info: 'Brief info', coordinates: { marker: [3, 101] } };

    createMarkerRenderer({
      L: { marker: vi.fn(() => marker) },
      markersLayer: { addLayer: vi.fn() },
      onSiteSelected: vi.fn(),
      getIsCompleted: () => false,
    }).render([site]);

    expect(marker.bindPopup).toHaveBeenCalledOnce();
    expect(String(marker.popupContent.textContent || marker.popupContent)).toContain('Site');
    expect(String(marker.popupContent.textContent || marker.popupContent)).toContain('Brief info');
  });
});
