/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPlatformWarningController } from '../../src/features/access/platform-warning-controller.js';

describe('platform warning controller', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="passcodeInput" value="AB-12345">
      <div id="platformWarningModal"></div>
      <div id="warningContent"><p></p></div>
      <input id="passkeyDisplay">
      <button id="continueLoginBtn"></button>
      <button id="cancelLoginBtn"></button>
      <button id="copyPasskeyBtn"></button>
      <p id="copySuccess" class="hidden"></p>
      <button id="whatIsPWABtn"></button>
      <button id="closePWAExplanation"></button>
      <button id="gotItPWABtn"></button>
      <button id="unlockBtn"></button>
      <p id="errorMsg"></p>
    `;
    window.matchMedia = vi.fn(() => ({ matches: false }));
  });

  it('submits the captured passkey and continues only after authentication', async () => {
    const modalManager = { open: vi.fn(), close: vi.fn() };
    const visitorAccess = {
      submit: vi.fn().mockResolvedValue({ authenticated: true, role: 'visitor' }),
    };
    const onAuthenticated = vi.fn();
    const controller = createPlatformWarningController({
      modalManager,
      visitorAccess,
      onAuthenticated,
    });

    await controller.open();
    document.getElementById('continueLoginBtn').click();
    await Promise.resolve();
    await Promise.resolve();

    expect(visitorAccess.submit).toHaveBeenCalledWith('AB-12345', {
      button: document.getElementById('unlockBtn'),
      errorElement: document.getElementById('errorMsg'),
    });
    expect(onAuthenticated).toHaveBeenCalledOnce();
  });

  it('clears the source passkey when cancelled', async () => {
    const controller = createPlatformWarningController({
      modalManager: { open: vi.fn(), close: vi.fn() },
      visitorAccess: { submit: vi.fn() },
    });

    await controller.open();
    document.getElementById('cancelLoginBtn').click();

    expect(document.getElementById('passcodeInput').value).toBe('');
  });
});
