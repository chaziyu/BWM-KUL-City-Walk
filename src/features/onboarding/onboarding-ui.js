export function configurePwaPrompt({ deferredPrompt }) {
  const pwaPrompt = document.getElementById('pwaInstallPrompt');
  const installBtn = document.getElementById('pwaInstallBtn');
  const iosInstructions = document.getElementById('iosInstructions');
  const genericInstructions = document.getElementById('genericInstructions');
  if (!pwaPrompt || !installBtn || !iosInstructions || !genericInstructions) return;

  const ua = navigator.userAgent || navigator.vendor || window.opera;
  const isIos = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isAndroid = /android/i.test(ua);

  iosInstructions.classList.toggle('hidden', !isIos);
  installBtn.classList.toggle('hidden', !(deferredPrompt && isAndroid));
  genericInstructions.classList.toggle('hidden', isIos || (deferredPrompt && isAndroid));
  pwaPrompt.classList.remove('hidden');
}
