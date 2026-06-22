export function setButtonLoading(button, { isLoading, loadingText = 'Loading...', defaultText } = {}) {
  if (!button) return;

  if (isLoading) {
    if (!button.dataset.defaultText) {
      button.dataset.defaultText = defaultText || button.textContent;
    }
    button.textContent = loadingText;
    button.disabled = true;
  } else {
    button.textContent = defaultText || button.dataset.defaultText || button.textContent;
    button.disabled = false;
    delete button.dataset.defaultText;
  }
}

export function renderError(container, message) {
  if (!container) return;
  container.innerHTML = '';

  const errorEl = document.createElement('div');
  errorEl.className =
    'text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3';
  errorEl.textContent = message;
  container.appendChild(errorEl);
}
