/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { createTextSizeController } from '../../src/ui/text-size-controller.js';

describe('text size controller', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('--content-font-size');
    document.body.innerHTML = `
      <button id="btnTextSizeSmall"></button>
      <button id="btnTextSizeLarge"></button>
      <button id="btnTextSizeReset"></button>
    `;
  });

  it('loads stored UI size and clamps changes', () => {
    localStorage.setItem('jejak_ui_text_size', '120');
    const controller = createTextSizeController({ maxFontSize: 130 });

    controller.bind();
    expect(document.documentElement.style.getPropertyValue('--content-font-size')).toBe('120%');

    document.getElementById('btnTextSizeLarge').click();
    document.getElementById('btnTextSizeLarge').click();
    expect(document.documentElement.style.getPropertyValue('--content-font-size')).toBe('130%');

    document.getElementById('btnTextSizeReset').click();
    expect(localStorage.getItem('jejak_ui_text_size')).toBe('100');
  });

  it('migrates the legacy size value when binding', () => {
    localStorage.setItem('ui_text_size', '110');
    createTextSizeController({ maxFontSize: 130 }).bind();

    expect(localStorage.getItem('jejak_ui_text_size')).toBe('110');
  });
});
