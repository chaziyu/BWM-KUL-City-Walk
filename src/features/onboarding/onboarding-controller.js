import { configurePwaPrompt } from './onboarding-ui.js';

export function createOnboardingController({ getCurrentSession, modalManager }) {
  let deferredPrompt = null;
  let bound = false;

  function canOfferInstall() {
    if (getCurrentSession()?.authenticated) return false;
    const dismissedUntil = Number.parseInt(localStorage.getItem('pwa_prompt_dismissed') || '0', 10);
    return !dismissedUntil || Date.now() >= dismissedUntil;
  }

  function refreshInstallPrompt() {
    if (!canOfferInstall()) return;
    configurePwaPrompt({ deferredPrompt });
  }

  function bind() {
    if (bound) return;
    bound = true;

    document.getElementById('btnPreLoginHelp')?.addEventListener('click', () => modalManager.open('userGuideModal'));
    document.getElementById('closeUserGuideModal')?.addEventListener('click', () => modalManager.close('userGuideModal'));
    document.getElementById('closeUserGuideModalBtn')?.addEventListener('click', () => modalManager.close('userGuideModal'));
    document.getElementById('closeWelcomeModal')?.addEventListener('click', () => modalManager.close('welcomeModal'));

    window.addEventListener('beforeinstallprompt', (event) => {
      event.preventDefault();
      deferredPrompt = event;
      refreshInstallPrompt();
    });

    window.addEventListener('load', () => {
      setTimeout(refreshInstallPrompt, 1000);
    });

    document.getElementById('pwaInstallBtn')?.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      document.getElementById('pwaInstallPrompt')?.classList.add('hidden');
    });

    const dismissPrompt = () => {
      document.getElementById('pwaInstallPrompt')?.classList.add('hidden');
      localStorage.setItem('pwa_prompt_dismissed', String(Date.now() + (7 * 24 * 60 * 60 * 1000)));
    };
    document.getElementById('closePWAPrompt')?.addEventListener('click', dismissPrompt);
    document.getElementById('continueBrowser')?.addEventListener('click', dismissPrompt);
  }

  function openWelcomeOnce() {
    if (sessionStorage.getItem('jejak_welcome_shown')) return;
    modalManager.open('welcomeModal');
    sessionStorage.setItem('jejak_welcome_shown', 'true');
  }

  return { bind, openWelcomeOnce };
}
