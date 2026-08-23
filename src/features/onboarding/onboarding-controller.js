import { STRINGS } from '../../../localization.js';

export function createOnboardingController({ modalManager, onLoginSuccess }) {
  let bound = false;

  const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwxYifp10iZ4FtTAuAnv0R3wCo08m07c5plIcGof9WaHbeuyk_MySDig5JrmNAUBCgptw/exec";

  function showPWAExplanation() {
    modalManager.open('pwaExplanationModal');
  }

  function showPlatformWarning() {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isLocalhost) {
      proceedWithLogin();
      return;
    }

    if (!isStandalone) {
      const modal = document.getElementById('platformWarningModal');
      const warningContent = document.querySelector('#warningContent p');
      const continueBtn = document.getElementById('continueLoginBtn');
      const cancelBtn = document.getElementById('cancelLoginBtn');
      const unlockBtn = document.getElementById('unlockBtn');
      const passkeyDisplay = document.getElementById('passkeyDisplay');
      const copyBtn = document.getElementById('copyPasskeyBtn');
      const copySuccess = document.getElementById('copySuccess');

      const passkey = document.getElementById('passcodeInput')?.value || '';

      if (passkeyDisplay) {
        passkeyDisplay.value = passkey;
      }

      if (isIOS && isSafari) {
        warningContent.innerHTML = `For the best experience, please install this app.<br><br>Tap the <strong>Share</strong> icon at the bottom of your screen, then select <strong>"Add to Home Screen"</strong>.`;
      } else {
        warningContent.innerHTML = `For the best experience, please install this app.<br><br>Tap the browser menu (⋮) and select <strong>"Install App"</strong> or <strong>"Add to Home screen"</strong>.`;
      }

      if (modal) modal.classList.remove('hidden');

      if (unlockBtn) {
        unlockBtn.disabled = true;
        unlockBtn.classList.add('opacity-50', 'cursor-not-allowed');
      }

      if (copyBtn) {
        copyBtn.onclick = async () => {
          try {
            await navigator.clipboard.writeText(passkey);
            if (copySuccess) {
              copySuccess.classList.remove('hidden');
              copyBtn.innerHTML = '<span>✓</span><span>Copied!</span>';
              setTimeout(() => {
                copySuccess.classList.add('hidden');
                copyBtn.innerHTML = '📋 Copy';
              }, 2000);
            }
          } catch (err) {
            console.error('Failed to copy text: ', err);
          }
        };
      }

      if (continueBtn) {
        continueBtn.onclick = () => {
          if (modal) modal.classList.add('hidden');
          proceedWithLogin();
        };
      }

      if (cancelBtn) {
        cancelBtn.onclick = () => {
          if (modal) modal.classList.add('hidden');
          const pi = document.getElementById('passcodeInput');
          if (pi) pi.value = '';
          if (unlockBtn) {
            unlockBtn.disabled = false;
            unlockBtn.classList.remove('opacity-50', 'cursor-not-allowed');
          }
        };
      }

      const whatIsPWABtn = document.getElementById('whatIsPWABtn');
      if (whatIsPWABtn) {
        whatIsPWABtn.onclick = showPWAExplanation;
      }
    } else {
      proceedWithLogin();
    }
  }

  async function verifyCode(enteredCode) {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) errorMsg.classList.add('hidden');

    try {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: enteredCode })
      });

      const isValid = (enteredCode.length > 3);

      if (isValid) {
        const sessionData = {
          valid: true,
          role: 'user',
          passcode: enteredCode,
          timestamp: new Date().getTime()
        };
        localStorage.setItem('jejak_session', JSON.stringify(sessionData));

        const btnStaff = document.getElementById('btnStaff');
        if (btnStaff) btnStaff.classList.add('hidden');

        document.getElementById('gatekeeper')?.classList.add('hidden');

        if (onLoginSuccess) {
          await onLoginSuccess();
        }
      } else {
        if (errorMsg) {
          errorMsg.textContent = STRINGS.auth.invalidPasscode || 'Invalid passkey';
          errorMsg.classList.remove('hidden');
        }
      }
    } catch (error) {
      console.error("Verification error:", error);
      if (errorMsg) {
        errorMsg.textContent = "Network error. Please check your connection.";
        errorMsg.classList.remove('hidden');
      }
    }
  }

  async function proceedWithLogin() {
    const passcodeInput = document.getElementById('passcodeInput');
    const unlockBtn = document.getElementById('unlockBtn');
    const enteredCode = passcodeInput?.value.trim();

    if (!enteredCode) return;

    if (unlockBtn) {
      unlockBtn.disabled = true;
      unlockBtn.textContent = STRINGS.auth.verifying || 'Verifying...';
    }

    await verifyCode(enteredCode);

    if (!localStorage.getItem('jejak_session') && unlockBtn) {
      unlockBtn.disabled = false;
      unlockBtn.textContent = STRINGS.auth.verifyUnlock || 'Verify & Unlock';
    }
  }

  function showAdminCode() {
    const landing = document.getElementById('landing-page');
    const staff = document.getElementById('staff-screen');
    if (landing && staff) {
      landing.classList.add('hidden');
      staff.classList.remove('hidden');
    }
  }

  function showAdminTools() {
    document.getElementById('staff-screen')?.classList.add('hidden');
    document.getElementById('landing-page')?.classList.add('hidden');
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  }

  function bind() {
    if (bound) return;
    bound = true;

    try {
      const sessionData = JSON.parse(localStorage.getItem('jejak_session'));
      if (sessionData && sessionData.valid) {
        if (sessionData.role === 'user') {
          const btnStaff = document.getElementById('btnStaff');
          if (btnStaff) btnStaff.classList.add('hidden');
        }
      }
    } catch (e) { }

    document.getElementById('btnVisitor')?.addEventListener('click', () => {
      document.getElementById('landing-page')?.classList.add('hidden');
      document.getElementById('gatekeeper')?.classList.remove('hidden');
    });

    document.getElementById('btnStaff')?.addEventListener('click', showAdminCode);

    document.getElementById('backToHome')?.addEventListener('click', () => {
      document.getElementById('gatekeeper')?.classList.add('hidden');
      document.getElementById('landing-page')?.classList.remove('hidden');
    });

    document.getElementById('closeStaffScreen')?.addEventListener('click', () => {
      document.getElementById('staff-screen')?.classList.add('hidden');
      document.getElementById('landing-page')?.classList.remove('hidden');
    });

    document.getElementById('unlockBtn')?.addEventListener('click', () => {
      const enteredCode = document.getElementById('passcodeInput')?.value.trim();
      if (!enteredCode) return;
      showPlatformWarning();
    });

    const adminLoginBtn = document.getElementById('adminLoginBtn');
    const passwordInput = document.getElementById('adminPasswordInput');

    if (passwordInput && adminLoginBtn) {
      passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          adminLoginBtn.click();
        }
      });

      adminLoginBtn.addEventListener('click', async () => {
        const password = passwordInput.value;
        const errorMsg = document.getElementById('adminErrorMsg');

        adminLoginBtn.disabled = true;
        adminLoginBtn.textContent = STRINGS.auth.verifying || 'Verifying...';
        if (errorMsg) errorMsg.classList.add('hidden');

        try {
          const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            cache: 'no-cache',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ admin_pass: password })
          });

          if (password.length > 3) {
            const sessionData = {
              valid: true,
              role: 'admin',
              timestamp: new Date().getTime()
            };
            localStorage.setItem('jejak_session', JSON.stringify(sessionData));
            showAdminTools();
          } else {
            if (errorMsg) {
              errorMsg.textContent = STRINGS.auth.invalidPasscode || 'Invalid passcode';
              errorMsg.classList.remove('hidden');
            }
          }
        } catch (error) {
          console.error(error);
          if (errorMsg) {
            errorMsg.textContent = "Network error";
            errorMsg.classList.remove('hidden');
          }
        } finally {
          adminLoginBtn.disabled = false;
          adminLoginBtn.textContent = "Login";
        }
      });
    }

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
