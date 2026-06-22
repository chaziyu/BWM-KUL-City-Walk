import { bindEnterKey, setButtonState, setMessage } from './access-ui.js';

export function createAdminAccess({
  strings,
  startAdminSession,
  endSession,
  onSession,
  onShowMap,
}) {
  let lastGeneratedCode = '';

  function bindLogin({ button, input, errorElement, onSuccess }) {
    if (!button || button.dataset.bound === 'true') return;
    button.dataset.bound = 'true';
    bindEnterKey(input, () => button.click());

    button.addEventListener('click', async () => {
      setButtonState(button, { disabled: true, text: strings.auth.verifying });
      setMessage(errorElement, '');

      try {
        const session = await startAdminSession(input?.value || '');
        onSession?.(session);
        onSuccess?.();
      } catch (error) {
        setMessage(errorElement, error.message || strings.auth.invalidAdmin);
      } finally {
        setButtonState(button, { disabled: false, text: strings.auth.login });
      }
    });
  }

  function bindTools({ generateBtn, shareBtn, statusMsg, resultText, logoutBtn, switchToMapBtn }) {
    if (generateBtn && generateBtn.dataset.bound !== 'true') {
      generateBtn.dataset.bound = 'true';
      generateBtn.addEventListener('click', async () => {
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
        statusMsg?.classList.add('hidden');

        try {
          const response = await fetch('/api/admin/generate-passkey', {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
          });
          const result = await response.json();
          if (!response.ok || !result.success) throw new Error(result.error || 'Check password');
          lastGeneratedCode = result.passkey || result.code;
          if (resultText) resultText.textContent = lastGeneratedCode;
          if (statusMsg) {
            statusMsg.textContent = strings.auth.adminGenSuccess;
            statusMsg.classList.remove('hidden');
          }
          shareBtn?.classList.remove('hidden');
        } catch (error) {
          window.alert(`Failed: ${error.message}`);
        } finally {
          generateBtn.disabled = false;
          generateBtn.textContent = strings.auth.adminGenerateBtn;
        }
      });
    }

    if (shareBtn && shareBtn.dataset.bound !== 'true') {
      shareBtn.dataset.bound = 'true';
      shareBtn.addEventListener('click', () => {
        if (!lastGeneratedCode) {
          setMessage(statusMsg, 'Generate a passkey before sharing via email.');
          return;
        }

        const subject = encodeURIComponent('BWM KUL City Walk Visitor Passkey');
        const body = encodeURIComponent(`Hello,

Here is today's BWM KUL City Walk visitor passkey:

${lastGeneratedCode}

Please enter this passkey on the visitor access screen to begin the heritage walk.

Regards,
Badan Warisan Malaysia`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
      });
    }

    if (logoutBtn && logoutBtn.dataset.bound !== 'true') {
      logoutBtn.dataset.bound = 'true';
      logoutBtn.addEventListener('click', async () => {
        await endSession();
        window.location.reload();
      });
    }

    if (switchToMapBtn && switchToMapBtn.dataset.bound !== 'true') {
      switchToMapBtn.dataset.bound = 'true';
      switchToMapBtn.addEventListener('click', () => onShowMap?.());
    }
  }

  return {
    bindLogin,
    bindTools,
  };
}
