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
