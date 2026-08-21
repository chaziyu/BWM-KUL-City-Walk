export function createOnboardingController({ modalManager }) {
  let bound = false;

  function bind() {
    if (bound) return;
    bound = true;

    document.getElementById('btnPreLoginHelp')?.addEventListener('click', () => modalManager.open('userGuideModal'));
    document.getElementById('closeUserGuideModal')?.addEventListener('click', () => modalManager.close('userGuideModal'));
    document.getElementById('closeUserGuideModalBtn')?.addEventListener('click', () => modalManager.close('userGuideModal'));
    document.getElementById('closeWelcomeModal')?.addEventListener('click', () => modalManager.close('welcomeModal'));
  }

  function openWelcomeOnce() {
    if (sessionStorage.getItem('jejak_welcome_shown')) return;
    modalManager.open('welcomeModal');
    sessionStorage.setItem('jejak_welcome_shown', 'true');
  }

  return { bind, openWelcomeOnce };
}
