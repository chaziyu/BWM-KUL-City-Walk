/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { bindMapUI } from '../../src/features/map/map-ui.js';

describe('map UI', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="btnRecenter"></button>
      <button id="btnUIZoomIn"></button>
      <button id="btnUIZoomOut"></button>
      <button id="tabMustVisit" class="map-filter-tab" aria-pressed="true"></button>
      <button id="tabRecommended" class="map-filter-tab" aria-pressed="false"></button>
    `;
  });

  it('uses aria-pressed for filter state without replacing design classes', () => {
    let mode = 'must_visit';
    const controller = {
      recenter: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getFilterMode: vi.fn(() => mode),
      setFilterMode: vi.fn((nextMode) => {
        mode = nextMode;
      }),
    };

    bindMapUI({
      controller,
      defaultCenter: [3.14, 101.69],
      defaultZoom: 16,
    });

    const mustVisit = document.getElementById('tabMustVisit');
    const recommended = document.getElementById('tabRecommended');

    recommended.click();

    expect(controller.setFilterMode).toHaveBeenCalledWith('recommended');
    expect(recommended.getAttribute('aria-pressed')).toBe('true');
    expect(mustVisit.getAttribute('aria-pressed')).toBe('false');
    expect(recommended.classList.contains('map-filter-tab')).toBe(true);
    expect(mustVisit.classList.contains('map-filter-tab')).toBe(true);
  });

  it('keeps utility controls wired to the map controller', () => {
    const controller = {
      recenter: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      getFilterMode: vi.fn(() => 'must_visit'),
      setFilterMode: vi.fn(),
    };

    bindMapUI({
      controller,
      defaultCenter: [3.14, 101.69],
      defaultZoom: 16,
    });

    document.getElementById('btnUIZoomIn').click();
    document.getElementById('btnUIZoomOut').click();
    document.getElementById('btnRecenter').click();

    expect(controller.zoomIn).toHaveBeenCalledOnce();
    expect(controller.zoomOut).toHaveBeenCalledOnce();
    expect(controller.recenter).toHaveBeenCalledWith([3.14, 101.69], 16);
  });
});
