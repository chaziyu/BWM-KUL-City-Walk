/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createGameUiBindings } from '../../src/app/game-ui-bindings.js';

function controller() {
  return { bind: vi.fn() };
}

describe('game UI bindings', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="siteModal"></div>
      <div id="passportModal"></div>
      <div id="congratsModal"></div>
      <button id="closeCongratsModal"></button>
      <button id="sharePassportBtn"></button>
      <button id="shareWhatsAppBtn"></button>
      <button id="btnAdminToggle"></button>
      <button id="resetDemoProgressBtn"></button>
      <div id="logoOverlay"></div>
    `;
    window.open = vi.fn();
    window.confirm = vi.fn(() => true);
    Object.defineProperty(navigator, 'share', { value: undefined, configurable: true });
  });

  it('binds feature controllers only once', () => {
    const siteModalController = controller();
    const passportController = { ...controller(), buildSharePayload: vi.fn() };
    const chatController = { ...controller(), loadHistory: vi.fn() };
    const challengeController = controller();
    const badgeController = controller();
    const directionsController = controller();
    const textSizeController = controller();

    const bindings = createGameUiBindings({
      badgeController,
      challengeController,
      chatController,
      directionsController,
      getSession: () => ({ role: 'visitor' }),
      modalManager: { close: vi.fn(), closeTopmost: vi.fn() },
      onShowAdmin: vi.fn(),
      passportController,
      resetDemoProgress: vi.fn(),
      siteModalController,
      textSizeController,
    });

    bindings.bind();
    bindings.bind();

    expect(siteModalController.bind).toHaveBeenCalledOnce();
    expect(passportController.bind).toHaveBeenCalledOnce();
    expect(chatController.bind).toHaveBeenCalledOnce();
    expect(chatController.loadHistory).toHaveBeenCalledOnce();
    expect(textSizeController.bind).toHaveBeenCalledOnce();
  });

  it('opens admin only for an admin session', () => {
    let session = { role: 'visitor' };
    const onShowAdmin = vi.fn();
    const bindings = createGameUiBindings({
      badgeController: controller(),
      challengeController: controller(),
      chatController: { ...controller(), loadHistory: vi.fn() },
      directionsController: controller(),
      getSession: () => session,
      modalManager: { close: vi.fn(), closeTopmost: vi.fn() },
      onShowAdmin,
      passportController: { ...controller(), buildSharePayload: vi.fn() },
      resetDemoProgress: vi.fn(),
      siteModalController: controller(),
      textSizeController: controller(),
    });

    bindings.bind();
    document.getElementById('btnAdminToggle').click();
    expect(onShowAdmin).not.toHaveBeenCalled();

    session = { role: 'admin' };
    document.getElementById('btnAdminToggle').click();
    expect(onShowAdmin).toHaveBeenCalledOnce();
  });

  it('falls back to WhatsApp sharing when Web Share is unavailable', () => {
    const passportController = {
      ...controller(),
      buildSharePayload: vi.fn(() => ({ text: 'Progress', url: 'https://example.com/' })),
    };
    const bindings = createGameUiBindings({
      badgeController: controller(),
      challengeController: controller(),
      chatController: { ...controller(), loadHistory: vi.fn() },
      directionsController: controller(),
      getSession: () => ({ role: 'visitor' }),
      modalManager: { close: vi.fn(), closeTopmost: vi.fn() },
      onShowAdmin: vi.fn(),
      passportController,
      resetDemoProgress: vi.fn(),
      siteModalController: controller(),
      textSizeController: controller(),
    });

    bindings.bind();
    document.getElementById('sharePassportBtn').click();

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('https://api.whatsapp.com/send?text='),
      '_blank',
      'noopener,noreferrer',
    );
  });
});
