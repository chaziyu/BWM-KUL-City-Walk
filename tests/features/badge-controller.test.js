/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { createBadgeController } from '../../src/features/badge/badge-controller.js';
import {
    BADGE_PHOTO_MAX_BYTES,
    BadgeUploadError,
    DEFAULT_BADGE_AVATAR,
    validateBadgePhoto,
} from '../../src/features/badge/badge-renderer.js';
import { createBadgeTemplate } from '../../src/features/badge/badge-template.js';
import { STRINGS } from '../../localization.js';

describe('badge controller', () => {
  it('rejects oversized badge photos', () => {
    expect(() => validateBadgePhoto({ type: 'image/jpeg', size: BADGE_PHOTO_MAX_BYTES + 1 }))
      .toThrow(BadgeUploadError);
  });

  it('rejects unsupported badge photo types', () => {
    expect(() => validateBadgePhoto({ type: 'image/gif', size: 100 }))
      .toThrow(BadgeUploadError);
  });

  it('accepts supported badge photo types under the size cap', () => {
    expect(() => validateBadgePhoto({ type: 'image/webp', size: BADGE_PHOTO_MAX_BYTES }))
      .not.toThrow();
  });

  it('restores the generate button after upload validation fails', async () => {
    document.body.innerHTML = createBadgeTemplate();
    const input = document.getElementById('explorerPhotoInput');
    Object.defineProperty(input, 'files', {
      value: [{ type: 'image/png', size: BADGE_PHOTO_MAX_BYTES + 1 }],
      configurable: true,
    });
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
    expect(window.alert).toHaveBeenCalledWith('Please choose an image smaller than 5 MB.');
    expect(button.disabled).toBe(false);
    expect(button.textContent).toBe(STRINGS.game.generateBadge);
  });

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
