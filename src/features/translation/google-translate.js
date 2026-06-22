export function installGoogleTranslateLoader(buttonId = 'loadTranslateBtn') {
  loadGoogleTranslate();

  const button = document.getElementById(buttonId);
  if (!button || button.dataset.bound === 'true') return;
  button.dataset.bound = 'true';
  button.addEventListener('click', () => {
    loadGoogleTranslate();
  });
}

function loadGoogleTranslate() {
  window.googleTranslateElementInit = () => {
    if (!window.google?.translate || !document.getElementById('google_translate_element')) return;
    if (document.querySelector('.goog-te-gadget, .goog-te-combo')) return;

    new window.google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,ms,zh-CN,zh-TW,ta,id,ar,ja,ko,th,vi,fr,de,es,ru',
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
    }, 'google_translate_element');
  };

  if (window.google?.translate) {
    window.googleTranslateElementInit();
    return;
  }

  if (document.querySelector('script[data-google-translate]')) return;

  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.dataset.googleTranslate = 'true';
  document.head.appendChild(script);
}
