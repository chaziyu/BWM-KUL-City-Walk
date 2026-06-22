import { installGoogleTranslateLoader } from '../access/google-translate.js';
import { suppressGoogleTranslatePopups } from './translation-ui.js';

export function createTranslationController() {
  let cleanup = null;
  let bound = false;

  function bind() {
    if (bound) return;
    bound = true;
    cleanup = suppressGoogleTranslatePopups();
    installGoogleTranslateLoader();
  }

  function destroy() {
    cleanup?.();
    cleanup = null;
    bound = false;
  }

  return { bind, destroy };
}
