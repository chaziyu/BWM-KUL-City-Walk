export function showOnly(ids) {
  ['landing-page', 'gatekeeper', 'staff-screen'].forEach((id) => {
    const element = document.getElementById(id);
    if (!element) return;
    element.classList.toggle('hidden', !ids.includes(id));
  });
}

export function setMessage(element, text) {
  if (!element) return;
  element.textContent = text;
  element.classList.toggle('hidden', !text);
}

export function setButtonState(button, { disabled, text }) {
  if (!button) return;
  button.disabled = disabled;
  if (typeof text === 'string') button.textContent = text;
}

export function bindEnterKey(input, callback) {
  if (!input || input.dataset.enterBound === 'true') return;
  input.dataset.enterBound = 'true';
  input.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      callback();
    }
  });
}
