/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installGoogleTranslateLoader } from '../../src/features/translation/google-translate.js';
import { createTranslationTemplate } from '../../src/features/translation/translation-template.js';

describe('google translate loader', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = createTranslationTemplate();
    document.head.innerHTML = '';
    delete window.google;
    delete window.googleTranslateElementInit;
  });

  it('shows the Google language selector when the translate button is clicked', () => {
    const combo = document.createElement('select');
    combo.className = 'goog-te-combo';
    combo.focus = vi.fn();

    function TranslateElement(options, id) {
      document.getElementById(id)?.append(combo);
    }
    window.google = { translate: { TranslateElement: vi.fn(TranslateElement) } };

    installGoogleTranslateLoader();
    document.getElementById('loadTranslateBtn').click();
    vi.runOnlyPendingTimers();

    expect(document.getElementById('translateWidget')?.classList.contains('open')).toBe(true);
    expect(document.getElementById('google_translate_element')?.hidden).toBe(false);
    expect(combo.focus).toHaveBeenCalled();
  });
});
