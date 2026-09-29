export function createTranslationTemplate() {
  return `<div id="translateWidget">
    <button id="loadTranslateBtn" type="button" class="ui-icon-button" aria-label="Translate page" title="Translate page">
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M3.5 12h17M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"></path>
      </svg>
    </button>
    <div id="google_translate_element" hidden></div>
  </div>`;
}
