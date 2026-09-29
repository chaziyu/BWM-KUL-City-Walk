export function createPlatformWarningController({
  modalManager,
  visitorAccess,
  onAuthenticated,
}) {
  let pendingPasskey = '';

  function isPwaMode() {
    return window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone
      || document.referrer.includes('android-app://');
  }

  function showPwaExplanation() {
    modalManager.open('pwaExplanationModal');
    document.getElementById('closePWAExplanation')?.addEventListener(
      'click',
      () => modalManager.close('pwaExplanationModal'),
      { once: true },
    );
    document.getElementById('gotItPWABtn')?.addEventListener(
      'click',
      () => modalManager.close('pwaExplanationModal'),
      { once: true },
    );
  }

  function getElements() {
    return {
      modal: document.getElementById('platformWarningModal'),
      warningContent: document.querySelector('#warningContent p'),
      continueBtn: document.getElementById('continueLoginBtn'),
      cancelBtn: document.getElementById('cancelLoginBtn'),
      passkeyDisplay: document.getElementById('passkeyDisplay'),
      copyBtn: document.getElementById('copyPasskeyBtn'),
      copySuccess: document.getElementById('copySuccess'),
      whatIsPWABtn: document.getElementById('whatIsPWABtn'),
    };
  }

  function bindWarningActions(elements) {
    const {
      modal,
      continueBtn,
      cancelBtn,
      passkeyDisplay,
      copyBtn,
      copySuccess,
      whatIsPWABtn,
    } = elements;

    if (copyBtn && copyBtn.dataset.bound !== 'true') {
      copyBtn.dataset.bound = 'true';
      copyBtn.addEventListener('click', async () => {
        try {
          await navigator.clipboard.writeText(pendingPasskey);
          copySuccess?.classList.remove('hidden');
          setTimeout(() => copySuccess?.classList.add('hidden'), 2000);
        } catch {
          passkeyDisplay?.select();
          document.execCommand('copy');
        }
      });
    }

    if (continueBtn && continueBtn.dataset.bound !== 'true') {
      continueBtn.dataset.bound = 'true';
      continueBtn.addEventListener('click', async () => {
        modalManager.close(modal);
        const session = await visitorAccess.submit(pendingPasskey, {
          button: document.getElementById('unlockBtn'),
          errorElement: document.getElementById('errorMsg'),
        });
        if (session?.authenticated) await onAuthenticated?.(session);
      });
    }

    if (cancelBtn && cancelBtn.dataset.bound !== 'true') {
      cancelBtn.dataset.bound = 'true';
      cancelBtn.addEventListener('click', () => {
        modalManager.close(modal);
        const input = document.getElementById('passcodeInput');
        if (input) input.value = '';
      });
    }

    if (whatIsPWABtn && whatIsPWABtn.dataset.bound !== 'true') {
      whatIsPWABtn.dataset.bound = 'true';
      whatIsPWABtn.addEventListener('click', showPwaExplanation);
    }
  }

  async function open() {
    const elements = getElements();
    const { modal, warningContent, passkeyDisplay } = elements;
    const passcodeInput = document.getElementById('passcodeInput');
    pendingPasskey = passcodeInput?.value || '';
    if (passkeyDisplay) passkeyDisplay.value = pendingPasskey;

    if (warningContent) {
      warningContent.textContent = isPwaMode()
        ? 'You are using the installed app view. Your passkey will be validated with this device.'
        : 'You are using the browser view. Your passkey will be validated with this device.';
    }

    modalManager.open(modal);
    bindWarningActions(elements);
  }

  return { open };
}
