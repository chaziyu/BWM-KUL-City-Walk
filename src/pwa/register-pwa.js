import { registerSW } from 'virtual:pwa-register';

function showUpdatePrompt(onConfirm) {
  // Prevent duplicate prompts
  if (document.getElementById('pwa-update-prompt')) return;

  const container = document.createElement('div');
  container.id = 'pwa-update-prompt';
  container.className = 'fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-4 right-4 z-[9999] md:left-auto md:right-4 md:w-96 bg-white/90 backdrop-blur-md border border-gray-200 shadow-2xl rounded-2xl p-4 flex flex-col gap-3 transition-transform duration-300 transform translate-y-full';

  container.innerHTML = `
    <div class="flex items-start gap-3">
      <span class="text-2xl" aria-hidden="true">✨</span>
      <div>
        <h4 class="text-sm font-bold text-gray-900">Update Available</h4>
        <p class="text-xs text-gray-600">A new version of BWM KUL City Walk is ready.</p>
      </div>
    </div>
    <div class="flex justify-end gap-2">
      <button id="pwa-update-later" class="px-3.5 py-1.5 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl hover:bg-gray-50 active:scale-95 transition-all cursor-pointer">
        Later
      </button>
      <button id="pwa-update-now" class="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl active:scale-95 transition-all shadow-sm cursor-pointer">
        Refresh now
      </button>
    </div>
  `;
  document.body.appendChild(container);

  // Animate slide up
  setTimeout(() => {
    container.classList.remove('translate-y-full');
  }, 50);

  const dismiss = () => {
    container.classList.add('translate-y-full');
    setTimeout(() => {
      container.remove();
    }, 300);
  };

  document.getElementById('pwa-update-later')?.addEventListener('click', dismiss);
  document.getElementById('pwa-update-now')?.addEventListener('click', () => {
    dismiss();
    onConfirm();
  });
}

const isAutomation = typeof navigator !== 'undefined' && navigator.webdriver;
const pwaEnabled = typeof window !== 'undefined' && window.__pwa_enabled__;

if ('serviceWorker' in navigator && (!isAutomation || pwaEnabled)) {
  // Capture the update function so "Refresh now" can both activate the waiting
  // worker AND reload the page in a single call.
  let updateServiceWorker = () => {};

  updateServiceWorker = registerSW({
    immediate: true,
    onNeedRefresh() {
      showUpdatePrompt(() => updateServiceWorker(true));
    },
    onOfflineReady() {
      console.log('App ready to work offline.');
    },
  });
}
