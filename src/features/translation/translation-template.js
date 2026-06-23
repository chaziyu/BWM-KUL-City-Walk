export function createTranslationTemplate() {
  return "<div id=\"translateWidget\" class=\"fixed top-[calc(5rem+env(safe-area-inset-top))] left-4 z-[5000]\">\n        <button id=\"loadTranslateBtn\" type=\"button\" aria-label=\"Translate page\" title=\"Translate page\">🌐</button>\n        <div id=\"google_translate_element\" hidden></div>\n    </div>";
}
