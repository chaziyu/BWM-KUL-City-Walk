/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
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
});
