const TOAST_CONTAINER_ID = 'toast-region';
const DEFAULT_DURATION = 7000;

const SEVERITY_CLASSES = {
  info: 'bg-blue-50 border-blue-300 text-blue-900',
  success: 'bg-green-50 border-green-300 text-green-900',
  warning: 'bg-amber-50 border-amber-300 text-amber-900',
  error: 'bg-red-50 border-red-300 text-red-900',
};

let hideTimer = null;

function getOrCreateContainer() {
  let container = document.getElementById(TOAST_CONTAINER_ID);
  if (!container) {
    container = document.createElement('div');
    container.id = TOAST_CONTAINER_ID;
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.className =
      'fixed bottom-24 left-4 right-4 z-[5000] text-sm font-semibold rounded-lg px-4 py-3 shadow-lg transition-opacity duration-300 hidden';
    document.body.appendChild(container);
  }
  return container;
}

export function showToast(message, options = {}) {
  const { duration = DEFAULT_DURATION, severity = options.type || 'info' } = options;
  const container = getOrCreateContainer();
  const severityClass = SEVERITY_CLASSES[severity] || SEVERITY_CLASSES.info;

  container.className =
    `fixed bottom-24 left-4 right-4 z-[5000] text-sm font-semibold rounded-lg px-4 py-3 shadow-lg border transition-opacity duration-300 ${severityClass}`;
  container.dataset.severity = severity;
  container.textContent = message;
  container.classList.remove('hidden');

  if (hideTimer) clearTimeout(hideTimer);
  if (duration > 0) {
    hideTimer = setTimeout(() => container.classList.add('hidden'), duration);
  }
}
