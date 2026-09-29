import { showOnly } from '../features/access/access-ui.js';

const ACCESS_SCREENS = Object.freeze({
  landing: ['landing-page'],
  gatekeeper: ['gatekeeper'],
  admin: ['staff-screen'],
  map: [],
  'map-error': ['map-error-screen'],
});

export function createViewController({ onViewChange } = {}) {
  function setMapChromeVisible(visible) {
    document.querySelectorAll('[data-map-chrome]').forEach((element) => {
      element.classList.toggle('hidden', !visible);
      element.setAttribute('aria-hidden', String(!visible));
    });

    const mapElement = document.getElementById('map');
    mapElement?.classList.toggle('hidden', !visible);
    mapElement?.setAttribute('aria-hidden', String(!visible));
  }

  function applySessionCapabilities(session) {
    const isAdmin = session?.role === 'admin';
    const allowedUI = new Set(session?.allowedUI || []);

    document.documentElement.classList.toggle('jejak-hide-staff', !isAdmin);

    [
      ['btnChat', 'chat'],
      ['btnPassport', 'passport'],
      ['btnChallenge', 'challenge'],
    ].forEach(([id, capability]) => {
      document.getElementById(id)?.classList.toggle('hidden', !allowedUI.has(capability));
    });

    document.getElementById('btnAdminToggle')?.classList.toggle('hidden', !isAdmin);
  }

  function transitionTo(view) {
    const accessScreens = ACCESS_SCREENS[view];
    if (!accessScreens) {
      throw new Error(`Unknown app view: ${view}`);
    }

    showOnly(accessScreens);
    setMapChromeVisible(view === 'map');

    if (view === 'landing') {
      document.documentElement.classList.remove('jejak-hide-staff');
    }

    onViewChange?.(view);
    return view;
  }

  return {
    applySessionCapabilities,
    transitionTo,
  };
}
