import L from 'leaflet';
import './styles/main.css';

window.L = L;
await import('leaflet-defaulticon-compatibility');

window.confetti = (...args) =>
  import('canvas-confetti').then(({ default: confetti }) => confetti(...args));

window.html2canvas = (...args) =>
  import('html2canvas').then(({ default: html2canvas }) => html2canvas(...args));

window.marked = {
  parse: (...args) => import('marked').then(({ marked }) => marked.parse(...args)),
};

function loadGoogleTranslate() {
  if (document.querySelector('script[data-google-translate]')) return;

  window.googleTranslateElementInit = () => {
    if (!window.google?.translate || !document.getElementById('google_translate_element')) return;

    new window.google.translate.TranslateElement({
      pageLanguage: 'en',
      includedLanguages: 'en,ms,zh-CN,zh-TW,ta,id,ar,ja,ko,th,vi,fr,de,es,ru',
      layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
    }, 'google_translate_element');
  };

  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.dataset.googleTranslate = 'true';
  document.head.appendChild(script);
}

document.getElementById('loadTranslateBtn')?.addEventListener('click', (event) => {
  event.currentTarget.disabled = true;
  event.currentTarget.textContent = 'Loading translate...';
  loadGoogleTranslate();
});

await import('../app.js');
