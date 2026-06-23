import { applyBadgeStatus } from '../passport/progress-ui.js';

export async function captureAndDownloadBadge({ progressService, strings }) {
  const badgeElement = document.getElementById('hiddenBadgeTemplate');
  if (!badgeElement) throw new Error('Badge template not found.');

  badgeElement.style.opacity = '1';
  badgeElement.style.zIndex = '-50';

  try {
    const state = progressService.getCompletionState();
    applyBadgeStatus({
      statusDisplay: document.getElementById('badgeStatusDisplay'),
      captionDisplay: document.getElementById('badgeCaptionDisplay'),
      statusStamp: document.getElementById('badgeStatusStamp'),
      count: state.count,
      total: state.total,
      isComplete: state.isComplete,
      strings,
    });
    applyCanvasSafeBadgeStyles(badgeElement);

    const canvas = await html2canvas(badgeElement, { scale: 2, backgroundColor: null });
    const filename = `Heritage-Explorer-${Date.now()}.png`;
    const triggerDownload = (href) => {
      const link = document.createElement('a');
      link.download = filename;
      link.href = href;
      link.click();
    };

    if (typeof canvas.toBlob === 'function') {
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((value) => (value ? resolve(value) : reject(new Error('Canvas export failed.'))), 'image/png');
      });
      const objectUrl = URL.createObjectURL(blob);
      triggerDownload(objectUrl);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      return;
    }

    triggerDownload(canvas.toDataURL('image/png'));
  } finally {
    badgeElement.style.opacity = '0';
  }
}

export function applyCanvasSafeBadgeStyles(badgeElement) {
  badgeElement.classList.add('notranslate');
  badgeElement.setAttribute('translate', 'no');
  badgeElement.style.backgroundColor = '#fdfaf5';
  badgeElement.style.borderColor = '#1a3c5e';
  badgeElement.style.color = '#1a3c5e';

  badgeElement.querySelectorAll('.text-gray-500').forEach((element) => {
    element.style.color = '#6b7280';
  });
  badgeElement.querySelectorAll('.bg-white').forEach((element) => {
    element.style.backgroundColor = '#ffffff';
  });

  const statusStamp = document.getElementById('badgeStatusStamp');
  if (statusStamp) {
    statusStamp.style.backgroundColor = 'rgba(127, 29, 29, 0.05)';
    statusStamp.style.borderColor = 'rgba(127, 29, 29, 0.7)';
    statusStamp.style.mixBlendMode = 'normal';
    statusStamp.querySelectorAll('*').forEach((element) => {
      element.style.color = 'rgba(127, 29, 29, 0.8)';
    });
  }

  const captionWrap = document.getElementById('badgeCaptionDisplay')?.parentElement;
  if (captionWrap) {
    captionWrap.style.backgroundColor = 'rgba(26, 60, 94, 0.05)';
    captionWrap.style.borderLeftColor = '#b4975a';
  }

  const header = badgeElement.querySelector('.mb-8');
  if (header) header.style.borderBottomColor = 'rgba(26, 60, 94, 0.1)';

  const footer = badgeElement.lastElementChild;
  if (footer) {
    footer.style.backgroundColor = 'rgba(26, 60, 94, 0.1)';
    footer.style.borderTopColor = 'rgba(26, 60, 94, 0.2)';
  }
}
