import { animateCloseModal, animateOpenModal } from '../utils/modal.js';
import { createFocusTrap } from './focus-trap.js';

function getModal(idOrElement) {
  return typeof idOrElement === 'string' ? document.getElementById(idOrElement) : idOrElement;
}

export function createModalManager({ appRoot = document, onModalStateChange } = {}) {
  const stack = [];
  let listening = false;

  function top() {
    return stack[stack.length - 1];
  }

  function syncListeners() {
    if (stack.length && !listening) {
      document.addEventListener('keydown', onKeyDown);
      appRoot.addEventListener?.('click', onClick);
      listening = true;
    } else if (!stack.length && listening) {
      document.removeEventListener('keydown', onKeyDown);
      appRoot.removeEventListener?.('click', onClick);
      listening = false;
    }
  }

  function onKeyDown(event) {
    const current = top();
    if (!current) return;
    if (event.key === 'Escape' && current.dismissible !== false) {
      event.preventDefault();
      closeTopmost();
      return;
    }
    current.trap.handleTab(event);
  }

  function onClick(event) {
    const current = top();
    if (!current || current.backdropClose === false) return;
    if (event.target === current.modal) closeTopmost();
  }

  function open(idOrElement, options = {}) {
    const modal = getModal(idOrElement);
    if (!modal) return;
    if (!stack.some((entry) => entry.modal === modal)) {
      stack.push({
        modal,
        id: modal.id,
        trap: createFocusTrap(modal),
        dismissible: options.dismissible,
        backdropClose: options.backdropClose,
        returnFocus: document.activeElement,
      });
    }

    document.body.classList.add('overflow-hidden');
    animateOpenModal(modal);
    setTimeout(() => top()?.trap.focusFirst(), 100);
    syncListeners();
    onModalStateChange?.({ id: modal.id, open: true, activeModal: top()?.id || null });
  }

  function close(idOrElement) {
    const modal = getModal(idOrElement);
    if (!modal) return;
    const index = stack.findIndex((entry) => entry.modal === modal);
    const wasTopmost = index === stack.length - 1;
    const [entry] = index !== -1 ? stack.splice(index, 1) : [];
    animateCloseModal(modal);

    if (!stack.length) {
      document.body.classList.remove('overflow-hidden');
    }

    if (wasTopmost) {
      const nextTop = top();
      if (nextTop) {
        if (entry?.returnFocus && nextTop.modal.contains(entry.returnFocus)) {
          entry.returnFocus.focus?.();
        } else {
          nextTop.trap.focusFirst();
        }
      } else {
        entry?.returnFocus?.focus?.();
      }
    }
    syncListeners();
    onModalStateChange?.({ id: modal.id, open: false, activeModal: top()?.id || null });
  }

  function closeTopmost() {
    const current = top();
    if (current) close(current.modal);
  }

  function destroy() {
    while (stack.length) stack.pop();
    document.removeEventListener('keydown', onKeyDown);
    appRoot.removeEventListener?.('click', onClick);
    document.body.classList.remove('overflow-hidden');
    listening = false;
  }

  return {
    close,
    closeTopmost,
    destroy,
    getOpenModals: () => stack.map((entry) => entry.id),
    open,
  };
}

const defaultManager = createModalManager();

export function openModal(idOrElement, options) {
  defaultManager.open(idOrElement, options);
}

export function closeModal(idOrElement) {
  defaultManager.close(idOrElement);
}

export function closeAllModals(modalIdsOrElements) {
  modalIdsOrElements.forEach(closeModal);
}
