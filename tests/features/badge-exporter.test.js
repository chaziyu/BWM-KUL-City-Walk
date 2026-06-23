/* @vitest-environment jsdom */
import { describe, expect, it, vi } from 'vitest';
import { applyCanvasSafeBadgeStyles } from '../../src/features/badge/badge-exporter.js';
import { createBadgeTemplate } from '../../src/features/badge/badge-template.js';

describe('badge exporter', () => {
  it('marks badge capture as notranslate and applies canvas-safe colors', () => {
    document.body.innerHTML = createBadgeTemplate();

    const badge = document.getElementById('hiddenBadgeTemplate');
    applyCanvasSafeBadgeStyles(badge);

    expect(badge.classList.contains('notranslate')).toBe(true);
    expect(badge.getAttribute('translate')).toBe('no');
    expect(badge.style.backgroundColor).toBe('rgb(253, 250, 245)');
    expect(badge.querySelector('.text-gray-500').style.color).toBe('rgb(107, 114, 128)');
    expect(document.getElementById('badgeStatusStamp').style.mixBlendMode).toBe('normal');
  });

  it('converts inherited oklch custom properties before capture', () => {
    document.body.innerHTML = createBadgeTemplate();
    const canvasContext = {
      canvas: {},
      clearRect: vi.fn(),
      fillRect: vi.fn(),
      getImageData: () => ({ data: [1, 2, 3, 255] }),
    };
    const getContext = vi.spyOn(window.HTMLCanvasElement.prototype, 'getContext').mockReturnValue(canvasContext);

    const badge = document.getElementById('hiddenBadgeTemplate');
    badge.style.setProperty('--color-red-900', 'oklch(39.6% .141 25.723)');

    applyCanvasSafeBadgeStyles(badge);

    expect(badge.style.getPropertyValue('--color-red-900')).toBe('rgb(1, 2, 3)');
    getContext.mockRestore();
  });
});
