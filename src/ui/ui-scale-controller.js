const UI_SCALE_KEY = 'jejak_ui_scale';

export function createUiScaleController({
  minScale = 90,
  maxScale = 120,
  step = 10,
  storage = localStorage,
} = {}) {
  let currentScale = 100;

  function apply(nextScale) {
    const parsed = Number(nextScale);
    const safeScale = Number.isFinite(parsed) ? parsed : 100;
    currentScale = Math.min(maxScale, Math.max(minScale, safeScale));

    document.documentElement.style.fontSize = `${currentScale}%`;
    storage.setItem(UI_SCALE_KEY, String(currentScale));
    return currentScale;
  }

  function increase() {
    return apply(currentScale + step);
  }

  function decrease() {
    return apply(currentScale - step);
  }

  function bind() {
    const stored = Number.parseInt(storage.getItem(UI_SCALE_KEY) || '100', 10);
    apply(Number.isFinite(stored) ? stored : 100);
  }

  return {
    apply,
    bind,
    decrease,
    increase,
    getScale: () => currentScale,
  };
}
