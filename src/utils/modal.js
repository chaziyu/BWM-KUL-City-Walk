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

export function installModalKeyboardHandlers() {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const sensitiveModals = ['#gatekeeper', '#landing-page'];
      const openModals = document.querySelectorAll('[role="dialog"]:not(.hidden)');

      openModals.forEach((modal) => {
        if (!sensitiveModals.includes(`#${modal.id}`)) {
          animateCloseModal(modal);
          if (modal.id === 'badgeInputModal') modal.classList.add('hidden');
        }
      });
    }

    if (event.key === 'Tab') {
      const openModal = document.querySelector('[role="dialog"]:not(.hidden)');
      if (!openModal) return;

      const focusableElements = openModal.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        lastElement.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        firstElement.focus();
        event.preventDefault();
      }
    }
  });
}

export function openModalState(modalId) {
  window.history.pushState({ modal: modalId }, '', window.location.pathname);
}
