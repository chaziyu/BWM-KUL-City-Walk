/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createBadgeController } from '../../src/features/badge/badge-controller.js';
import { DEFAULT_BADGE_AVATAR } from '../../src/features/badge/badge-renderer.js';
import { createBadgeTemplate } from '../../src/features/badge/badge-template.js';
import { STRINGS } from '../../localization.js';

describe('badge controller', () => {
  it('uses local default avatar and restores the generate button on failure', async () => {
    document.body.innerHTML = createBadgeTemplate();
    const image = document.getElementById('badgeProfileImage');
    Object.defineProperty(image, 'complete', { value: true, configurable: true });
    Object.defineProperty(image, 'naturalWidth', { value: 1, configurable: true });
    window.html2canvas = vi.fn().mockRejectedValue(new Error('capture failed'));
    window.alert = vi.fn();

    const controller = createBadgeController({
      modalManager: { close: vi.fn(), open: vi.fn() },
      progressService: {
        getCompletionState: () => ({ count: 1, total: 11, isComplete: false }),
      },
      strings: STRINGS,
    });

    controller.bind();
    await controller.generate();

    const button = document.getElementById('btnGenerateBadge');
    expect(image.src).toBe(DEFAULT_BADGE_AVATAR);
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe(STRINGS.game.generateBadge);
  });
});
