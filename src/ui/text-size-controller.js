const UI_TEXT_SIZE_KEY = 'jejak_ui_text_size';
const LEGACY_UI_TEXT_SIZE_KEY = 'ui_text_size';

export function createTextSizeController({ maxFontSize, storage = localStorage } = {}) {
  let currentTextSize = 100;

  function apply(nextSize) {
    currentTextSize = Math.min(maxFontSize, Math.max(80, nextSize));
    document.documentElement.style.setProperty('--content-font-size', `${currentTextSize}%`);
    storage.setItem(UI_TEXT_SIZE_KEY, String(currentTextSize));
  }

  function bind() {
    currentTextSize = Number.parseInt(
      storage.getItem(UI_TEXT_SIZE_KEY) || storage.getItem(LEGACY_UI_TEXT_SIZE_KEY) || '100',
      10,
    );
    if (!Number.isFinite(currentTextSize)) currentTextSize = 100;

    apply(currentTextSize);

    const controls = [
      ['btnTextSizeSmall', -10],
      ['btnTextSizeLarge', 10],
    ];

    controls.forEach(([id, delta]) => {
      const button = document.getElementById(id);
      if (!button || button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', () => apply(currentTextSize + delta));
    });

    const reset = document.getElementById('btnTextSizeReset');
    if (reset && reset.dataset.bound !== 'true') {
      reset.dataset.bound = 'true';
      reset.addEventListener('click', () => apply(100));
    }
  }

  return { apply, bind };
}
