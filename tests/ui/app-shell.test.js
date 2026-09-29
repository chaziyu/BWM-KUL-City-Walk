/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { renderAppShell } from '../../src/ui/app-shell.js';

describe('app shell', () => {
  it('mounts feature templates once', () => {
    document.body.innerHTML = '<div id="app"></div>';
    renderAppShell();
    renderAppShell();

    expect(document.querySelectorAll('#btnChat')).toHaveLength(1);
    expect(document.querySelectorAll('#btnChallenge')).toHaveLength(1);
    expect(document.querySelectorAll('#btnPassport')).toHaveLength(1);
    expect(document.querySelectorAll('#btnTrails')).toHaveLength(1);
    expect(document.querySelector('[data-app-region="floating-controls"]')?.className).toContain('map-action-dock');
    expect(document.getElementById('landing-page')).toBeTruthy();
    expect(document.getElementById('map-error-screen')).toBeTruthy();
    expect(document.querySelectorAll('#chatModal')).toHaveLength(1);
    expect(document.querySelectorAll('#passportModal')).toHaveLength(1);
    expect(document.querySelectorAll('#challengeModal')).toHaveLength(1);
    expect(document.querySelectorAll('#trailModal')).toHaveLength(1);
    expect(document.getElementById('previewCard')).toBeNull();
    expect(document.querySelector('[data-app-region="floating-controls"]').classList.contains('hidden')).toBe(true);
    expect(document.querySelectorAll('[data-map-chrome]').length).toBeGreaterThan(0);
    expect(document.getElementById('siteModal')).toBeTruthy();
    expect(document.getElementById('tabMustVisit')?.getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById('tabRecommended')?.getAttribute('aria-pressed')).toBe('false');
    expect(document.getElementById('hiddenBadgeTemplate')).toBeTruthy();
  });
});
