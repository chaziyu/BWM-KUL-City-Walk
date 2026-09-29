/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccessFlow } from '../../src/app/access-flow.js';

describe('access flow', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="btnExploreDemo"></button>
      <button id="btnVisitor"></button>
      <button id="btnStaff"></button>
      <button id="backToHome"></button>
      <button id="closeStaffScreen"></button>
      <input id="passcodeInput">
      <button id="unlockBtn"></button>
      <button id="retryMapBtn"></button>
      <button id="mapErrorBackBtn"></button>
      <div id="platformWarningModal"></div>
      <div id="map"></div>
    `;
    window.history.replaceState({}, '', '/');
  });

  it('delegates visitor navigation to the view controller', () => {
    const viewController = { transitionTo: vi.fn() };
    const flow = createAccessFlow({
      bindAdminUI: vi.fn(),
      demoAccess: { start: vi.fn() },
      getSession: () => ({ authenticated: false, role: 'guest' }),
      onShowAdmin: vi.fn(),
      onShowLanding: vi.fn(),
      onShowMap: vi.fn(),
      platformWarningController: { open: vi.fn() },
      viewController,
    });

    flow.bind();
    document.getElementById('btnVisitor').click();

    expect(viewController.transitionTo).toHaveBeenCalledWith('gatekeeper');
  });

  it('hydrates URL passkeys and opens the warning flow', async () => {
    window.history.replaceState({}, '', '/?code=AB-12345');
    const viewController = { transitionTo: vi.fn() };
    const platformWarningController = { open: vi.fn() };
    const flow = createAccessFlow({
      bindAdminUI: vi.fn(),
      demoAccess: { start: vi.fn() },
      getSession: () => ({ authenticated: false, role: 'guest' }),
      onShowAdmin: vi.fn(),
      onShowLanding: vi.fn(),
      onShowMap: vi.fn(),
      platformWarningController,
      viewController,
    });

    await expect(flow.checkForUrlPasskey()).resolves.toBe(true);

    expect(document.getElementById('passcodeInput').value).toBe('AB-12345');
    expect(viewController.transitionTo).toHaveBeenCalledWith('gatekeeper');
    expect(platformWarningController.open).toHaveBeenCalledOnce();
    expect(window.location.search).toBe('');
  });
});
