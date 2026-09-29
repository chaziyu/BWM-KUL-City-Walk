/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest';
import { createUiScaleController } from '../../src/ui/ui-scale-controller.js';

describe('UI scale controller', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty('font-size');
  });

  it('persists and clamps interface scaling', () => {
    const controller = createUiScaleController({
      minScale: 90,
      maxScale: 120,
      step: 10,
    });

    controller.bind();
    expect(document.documentElement.style.fontSize).toBe('100%');

    controller.increase();
    controller.increase();
    controller.increase();
    expect(document.documentElement.style.fontSize).toBe('120%');
    expect(localStorage.getItem('jejak_ui_scale')).toBe('120');

    controller.decrease();
    expect(document.documentElement.style.fontSize).toBe('110%');
  });

  it('restores the stored interface scale', () => {
    localStorage.setItem('jejak_ui_scale', '90');
    const controller = createUiScaleController();

    controller.bind();

    expect(controller.getScale()).toBe(90);
    expect(document.documentElement.style.fontSize).toBe('90%');
  });
});
