export function animateOpenModal(modal) {
  if (!modal) return;

  modal.classList.remove('hidden', 'modal-closing');
  modal.classList.add('modal-opening');

  const focusableElements = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  const firstFocusableElement = modal.querySelectorAll(focusableElements)[0];
  if (firstFocusableElement) {
    setTimeout(() => firstFocusableElement.focus(), 100);
  }
}

export function animateCloseModal(modal) {
  if (!modal || modal.classList.contains('hidden')) return;

  modal.classList.remove('modal-opening');
  modal.classList.add('modal-closing');
  setTimeout(() => {
    modal.classList.add('hidden');
    modal.classList.remove('modal-closing');
  }, 400);
}

export function animateScreenSwitch(fromScreen, toScreen) {
  if (!fromScreen || !toScreen) return;

  const fromZ = parseInt(window.getComputedStyle(fromScreen).zIndex) || 0;
  toScreen.style.zIndex = (fromZ + 1).toString();
  toScreen.classList.remove('hidden');
  toScreen.classList.remove('animate-fade-scale');
  void toScreen.offsetWidth;
  toScreen.classList.add('animate-fade-scale');

  fromScreen.classList.add('screen-slide-out');

  setTimeout(() => {
    fromScreen.classList.add('hidden');
    fromScreen.classList.remove('screen-slide-out');
    toScreen.style.removeProperty('z-index');
  }, 360);
}
