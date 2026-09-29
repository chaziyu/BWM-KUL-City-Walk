/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createLandingScreen } from '../../src/features/access/landing-screen.js';

describe('landing screen', () => {
  it('restores the original demo button content after async launch', async () => {
    document.body.innerHTML = `
      <button id="btnExploreDemo"><span class="original">Explore Demo</span></button>
      <button id="btnVisitor"></button>
      <button id="btnStaff"></button>
      <button id="backToHome"></button>
      <button id="closeStaffScreen"></button>
    `;

    let resolveDemo;
    const onExploreDemo = vi.fn(() => new Promise((resolve) => {
      resolveDemo = resolve;
    }));

    createLandingScreen({ onExploreDemo }).init();

    const button = document.getElementById('btnExploreDemo');
    button.click();

    expect(button.disabled).toBe(true);
    expect(button.textContent).toContain('Starting demo');

    resolveDemo();
    await Promise.resolve();
    await Promise.resolve();

    expect(button.disabled).toBe(false);
    expect(button.querySelector('.original')?.textContent).toBe('Explore Demo');
  });
});
