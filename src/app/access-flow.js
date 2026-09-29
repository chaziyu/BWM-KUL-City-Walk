import { createLandingScreen } from '../features/access/landing-screen.js';

const TEST_IDS = Object.freeze([
  ['btnVisitor', 'join-event-button'],
  ['passcodeInput', 'visitor-passkey-input'],
  ['unlockBtn', 'visitor-passkey-submit'],
  ['platformWarningModal', 'platform-warning'],
  ['continueLoginBtn', 'platform-warning-continue'],
  ['map', 'map-experience'],
]);

export function createAccessFlow({
  bindAdminUI,
  demoAccess,
  getSession,
  onShowAdmin,
  onShowLanding,
  onShowMap,
  platformWarningController,
  viewController,
}) {
  function applyTestIds() {
    TEST_IDS.forEach(([id, testId]) => {
      document.getElementById(id)?.setAttribute('data-testid', testId);
    });
  }

  async function checkForUrlPasskey() {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code || getSession()?.authenticated) return false;

    const cleanUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}`;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    viewController.transitionTo('gatekeeper');

    const input = document.getElementById('passcodeInput');
    if (input) input.value = code;

    await platformWarningController.open();
    return true;
  }

  function bind() {
    applyTestIds();

    const landingScreen = createLandingScreen({
      async onExploreDemo() {
        try {
          await demoAccess.start();
        } catch {
          window.alert('Unable to start the demo session. Please try again.');
          return;
        }
        await onShowMap();
      },
      onVisitor() {
        viewController.transitionTo('gatekeeper');
      },
      onStaff: onShowAdmin,
      onBackHome: onShowLanding,
      onCloseStaff: onShowLanding,
    });

    landingScreen.init();
    bindAdminUI();

    const retryMapBtn = document.getElementById('retryMapBtn');
    if (retryMapBtn && retryMapBtn.dataset.bound !== 'true') {
      retryMapBtn.dataset.bound = 'true';
      retryMapBtn.addEventListener('click', () => void onShowMap());
    }

    const mapErrorBackBtn = document.getElementById('mapErrorBackBtn');
    if (mapErrorBackBtn && mapErrorBackBtn.dataset.bound !== 'true') {
      mapErrorBackBtn.dataset.bound = 'true';
      mapErrorBackBtn.addEventListener('click', () => {
        if (getSession()?.role === 'admin') onShowAdmin();
        else onShowLanding();
      });
    }

    const unlockBtn = document.getElementById('unlockBtn');
    if (unlockBtn && unlockBtn.dataset.bound !== 'true') {
      unlockBtn.dataset.bound = 'true';
      unlockBtn.addEventListener('click', async () => {
        const passcodeInput = document.getElementById('passcodeInput');
        if (!passcodeInput?.value.trim()) return;
        await platformWarningController.open();
      });
    }
  }

  return {
    bind,
    checkForUrlPasskey,
  };
}
