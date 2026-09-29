/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createDirectionsController } from '../../src/features/directions/directions-controller.js';

function mountDirectionsDom() {
  document.body.innerHTML = `
    <div id="directionsModal" class="hidden">
      <h2 id="directionsTitle"></h2>
      <p id="directionsContextText"></p>
      <div id="directionsRouteRegion">
        <div id="directionsLoading"></div>
        <iframe id="directionsIframe"></iframe>
      </div>
      <div id="directionsSearchRegion" class="hidden">
        <div id="directionsSearchIcon"></div>
        <h3 id="directionsSearchTitle"></h3>
        <p id="directionsSearchText"></p>
      </div>
      <p id="directionsFooterLead"></p>
      <p id="directionsFooterDetail"></p>
      <a id="externalMapsLink"></a>
      <span id="externalMapsLinkText"></span>
      <span id="externalMapsLinkBadge"></span>
      <button id="closeDirectionsModal"></button>
      <button id="closeDirectionsModalBtn"></button>
    </div>
  `;
}

describe('directions controller nearby searches', () => {
  beforeEach(() => {
    mountDirectionsDom();
  });

  it('shows Food as a nearby search without loading the route iframe', () => {
    const modalManager = { open: vi.fn(), close: vi.fn() };
    const controller = createDirectionsController({ modalManager });
    const site = {
      name: 'Masjid Jamek',
      coordinates: { marker: [3.1489, 101.6956] },
    };

    expect(controller.openNearbySearch(site, 'food')).toBe(true);

    expect(document.getElementById('directionsTitle').textContent).toBe('🍜 Food Near Masjid Jamek');
    expect(document.getElementById('directionsRouteRegion').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('directionsSearchRegion').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('directionsIframe').getAttribute('src')).toBe('');
    expect(document.getElementById('externalMapsLinkText').textContent).toBe('Search Food in Google Maps');

    const url = new URL(document.getElementById('externalMapsLink').href);
    expect(url.searchParams.get('query')).toBe('restaurants near 3.1489,101.6956');
    expect(modalManager.open).toHaveBeenCalledWith('directionsModal');
  });

  it('shows Hotel as a nearby search with hotel-specific copy', () => {
    const modalManager = { open: vi.fn(), close: vi.fn() };
    const controller = createDirectionsController({ modalManager });
    const site = {
      name: 'Dataran Merdeka',
      coordinates: { marker: [3.149, 101.693] },
    };

    controller.openNearbySearch(site, 'hotel');

    expect(document.getElementById('directionsTitle').textContent).toBe('🏨 Hotels Near Dataran Merdeka');
    expect(document.getElementById('externalMapsLinkText').textContent).toBe('Search Hotels in Google Maps');
    const url = new URL(document.getElementById('externalMapsLink').href);
    expect(url.searchParams.get('query')).toBe('hotels near 3.149,101.693');
  });

  it('rejects unknown nearby kinds instead of silently opening restaurants', () => {
    const controller = createDirectionsController({
      modalManager: { open: vi.fn(), close: vi.fn() },
    });

    expect(() => controller.openNearbySearch({
      coordinates: { marker: [3.1, 101.6] },
    }, 'banana')).toThrow('Unsupported nearby search kind: banana');
  });

  it('reports invalid site coordinates without opening the modal', () => {
    const modalManager = { open: vi.fn(), close: vi.fn() };
    const onError = vi.fn();
    const controller = createDirectionsController({ modalManager, onError });

    expect(controller.openNearbySearch({ name: 'Broken' }, 'food')).toBe(false);

    expect(onError).toHaveBeenCalledWith('Nearby search is unavailable for this location.');
    expect(modalManager.open).not.toHaveBeenCalled();
  });

  it('keeps route preview behavior for walking directions', () => {
    const modalManager = { open: vi.fn(), close: vi.fn() };
    const controller = createDirectionsController({ modalManager });
    const site = {
      name: 'Masjid Jamek',
      coordinates: { marker: [3.1489, 101.6956] },
    };

    expect(controller.openDirections(site)).toBe(true);

    expect(document.getElementById('directionsTitle').textContent).toBe('🚶 Walk to Masjid Jamek');
    expect(document.getElementById('directionsRouteRegion').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('directionsSearchRegion').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('directionsIframe').src).toContain('dirflg=w');
  });
});
