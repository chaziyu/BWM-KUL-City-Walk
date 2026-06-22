import { captureAndDownloadBadge } from './badge-exporter.js';
import { BadgeUploadError, DEFAULT_BADGE_AVATAR, readFileAsDataUrl, waitForImage } from './badge-renderer.js';

export function createBadgeController({ modalManager, progressService, strings }) {
  function bind() {
    const openButtons = [
      document.getElementById('createBadgeFromPassportBtn'),
      document.getElementById('createBadgeFromCongratsBtn'),
    ];
    openButtons.forEach((button) => {
      if (!button || button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', () => open());
    });

    const closeButton = document.getElementById('closeBadgeModal');
    if (closeButton && closeButton.dataset.bound !== 'true') {
      closeButton.dataset.bound = 'true';
      closeButton.type = 'button';
      closeButton.addEventListener('click', () => modalManager.close('badgeInputModal'));
    }

    const generateButton = document.getElementById('btnGenerateBadge');
    const badgePhoto = document.getElementById('badgeProfileImage');
    if (badgePhoto) badgePhoto.src = DEFAULT_BADGE_AVATAR;
    if (generateButton && generateButton.dataset.badgeBound !== 'true') {
      generateButton.dataset.badgeBound = 'true';
      generateButton.addEventListener('click', () => void generate());
    }
  }

  function open() {
    bind();
    modalManager.open('badgeInputModal');
  }

  async function generate() {
    const button = document.getElementById('btnGenerateBadge');
    const nameInput = document.getElementById('explorerNameInput');
    const photoInput = document.getElementById('explorerPhotoInput');
    const badgeName = document.getElementById('badgeNameDisplay');
    const badgeDate = document.getElementById('badgeDateDisplay');
    const badgePhoto = document.getElementById('badgeProfileImage');
    if (!button || !badgeName || !badgeDate || !badgePhoto) return;

    const originalText = strings.game.generateBadge;
    button.textContent = strings.game.generatingBadge;
    button.disabled = true;

    try {
      const today = new Date();
      badgeName.textContent = nameInput?.value.trim() || 'Master Explorer';
      badgeDate.textContent = `${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;
      badgePhoto.src = photoInput?.files?.[0] ? await readFileAsDataUrl(photoInput.files[0]) : DEFAULT_BADGE_AVATAR;
      await waitForImage(badgePhoto);
      await captureAndDownloadBadge({ progressService, strings });
      document.getElementById('chaChingSound')?.play?.();
    } catch (error) {
      window.alert(error instanceof BadgeUploadError ? error.message : strings.game.badgeError);
    } finally {
      button.textContent = originalText;
      button.disabled = false;
    }
  }

  return { bind, generate, open };
}
