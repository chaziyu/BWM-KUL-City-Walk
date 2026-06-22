import { animateCloseModal, animateOpenModal } from '../utils/modal.js';

function getModal(idOrElement) {
  return typeof idOrElement === 'string' ? document.getElementById(idOrElement) : idOrElement;
}

export function openModal(idOrElement) {
  const modal = getModal(idOrElement);
  if (!modal) return;

  animateOpenModal(modal);
}

export function closeModal(idOrElement) {
  const modal = getModal(idOrElement);
  if (!modal) return;

  animateCloseModal(modal);
}

export function closeAllModals(modalIdsOrElements) {
  modalIdsOrElements.forEach(closeModal);
}
