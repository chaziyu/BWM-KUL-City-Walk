/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createViewController } from '../../src/app/view-controller.js';

describe('view controller', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="landing-page"></div>
      <div id="gatekeeper" class="hidden"></div>
      <div id="map-error-screen" class="hidden"></div>
      <div id="staff-screen" class="hidden"></div>
      <div id="map" class="hidden" aria-hidden="true"></div>
      <div data-map-chrome class="hidden" aria-hidden="true"></div>
      <button id="btnChat"></button>
      <button id="btnPassport"></button>
      <button id="btnChallenge"></button>
      <button id="btnAdminToggle"></button>
    `;
  });

  it('owns map/access visibility transitions', () => {
    const onViewChange = vi.fn();
    const controller = createViewController({ onViewChange });

    controller.transitionTo('map');

    expect(document.getElementById('landing-page').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('map').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('map').getAttribute('aria-hidden')).toBe('false');
    expect(document.querySelector('[data-map-chrome]').classList.contains('hidden')).toBe(false);
    expect(onViewChange).toHaveBeenCalledWith('map');

    controller.transitionTo('map-error');

    expect(document.getElementById('map-error-screen').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('map').classList.contains('hidden')).toBe(true);
    expect(document.querySelector('[data-map-chrome]').getAttribute('aria-hidden')).toBe('true');
  });

  it('applies session capabilities to global controls', () => {
    const controller = createViewController();

    controller.applySessionCapabilities({
      role: 'visitor',
      allowedUI: ['map', 'chat', 'passport'],
    });

    expect(document.getElementById('btnChat').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('btnPassport').classList.contains('hidden')).toBe(false);
    expect(document.getElementById('btnChallenge').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('btnAdminToggle').classList.contains('hidden')).toBe(true);
  });

  it('rejects unknown views', () => {
    expect(() => createViewController().transitionTo('unknown')).toThrow('Unknown app view');
  });
});
