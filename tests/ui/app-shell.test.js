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
    expect(document.getElementById('landing-page')).toBeTruthy();
    expect(document.getElementById('siteModal')).toBeTruthy();
    expect(document.getElementById('hiddenBadgeTemplate')).toBeTruthy();
  });
});
