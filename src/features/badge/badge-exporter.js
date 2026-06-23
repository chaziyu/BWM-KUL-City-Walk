import { applyBadgeStatus } from '../passport/progress-ui.js';

export async function captureAndDownloadBadge({ progressService, strings }) {
  const badgeElement = document.getElementById('hiddenBadgeTemplate');
  if (!badgeElement) throw new Error('Badge template not found.');

  badgeElement.style.opacity = '1';
  badgeElement.style.zIndex = '-50';
  let restoreDocumentColors = () => {};

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
    restoreDocumentColors = neutraliseOklchCustomProperties(document.documentElement, true);

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
    restoreDocumentColors();
    badgeElement.style.opacity = '0';
  }
}

/**
 * Color properties that html2canvas reads from computed styles.
 * Tailwind CSS v4 outputs oklch() for these, which html2canvas v1 cannot parse.
 */
const COLOR_PROPERTIES = [
  'color', 'backgroundColor', 'borderColor',
  'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
  'outlineColor', 'textDecorationColor',
];

const MODERN_COLOR_PATTERN = /oklch|oklab|color\(/;

/**
 * Convert any CSS color (including oklch) to an rgba() string by
 * drawing it on an offscreen canvas and reading the pixel back.
 */
function resolveToRgba(cssColor) {
  if (!cssColor || cssColor === 'transparent' || cssColor === 'rgba(0, 0, 0, 0)') {
    return cssColor;
  }
  // Already safe – skip the canvas round-trip
  if (!cssColor.includes('oklch') && !cssColor.includes('oklab') && !cssColor.includes('color(')) {
    return cssColor;
  }
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return cssColor;
  ctx.canvas.width = 1;
  ctx.canvas.height = 1;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = cssColor;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return a === 255
    ? `rgb(${r}, ${g}, ${b})`
    : `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`;
}

/**
 * Walk every element inside the badge template and replace any oklch()
 * computed color values with their rgb/rgba equivalents so that
 * html2canvas v1 can parse them.
 */
function neutraliseOklchColors(root) {
  const elements = [root, ...root.querySelectorAll('*')];
  for (const el of elements) {
    const computed = window.getComputedStyle(el);
    for (const prop of COLOR_PROPERTIES) {
      const value = computed[prop];
      if (value && MODERN_COLOR_PATTERN.test(value)) {
        el.style[prop] = resolveToRgba(value);
      }
    }
    neutraliseOklchCustomProperties(el);
  }
}

function neutraliseOklchCustomProperties(el, shouldRestore = false) {
  const computed = window.getComputedStyle(el);
  const changed = [];
  for (let i = 0; i < computed.length; i += 1) {
    const prop = computed.item(i);
    if (!prop.startsWith('--')) continue;
    const value = computed.getPropertyValue(prop);
    if (!value || !MODERN_COLOR_PATTERN.test(value)) continue;

    if (shouldRestore) {
      changed.push([prop, el.style.getPropertyValue(prop), el.style.getPropertyPriority(prop)]);
    }
    el.style.setProperty(prop, resolveToRgba(value));
  }

  return () => {
    for (const [prop, value, priority] of changed) {
      if (value) el.style.setProperty(prop, value, priority);
      else el.style.removeProperty(prop);
    }
  };
}

export function applyCanvasSafeBadgeStyles(badgeElement) {
  badgeElement.classList.add('notranslate');
  badgeElement.setAttribute('translate', 'no');

  // First, neutralise all oklch / modern color functions that html2canvas cannot parse
  neutraliseOklchColors(badgeElement);

  // Then apply explicit overrides for the badge design tokens
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
