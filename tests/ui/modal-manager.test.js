/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeAllModals, closeModal, openModal } from '../../src/ui/modal-manager.js';

describe('modal manager', () => {
  afterEach(() => {
    vi.useRealTimers();
    document.body.innerHTML = '';
  });

  it('opens and closes a modal element', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="modal" class="hidden"><button>Ok</button></div>';
    const modal = document.getElementById('modal');

    openModal(modal);
    expect(modal.classList.contains('hidden')).toBe(false);

    closeModal(modal);
    vi.advanceTimersByTime(400);

    expect(modal.classList.contains('hidden')).toBe(true);
  });

  it('closes provided modal ids and elements', () => {
    vi.useFakeTimers();
    document.body.innerHTML = '<div id="first"></div><div id="second"></div>';
    const second = document.getElementById('second');

    closeAllModals(['first', second]);
    vi.advanceTimersByTime(400);

    expect(document.getElementById('first').classList.contains('hidden')).toBe(true);
    expect(second.classList.contains('hidden')).toBe(true);
  });

  it('does not use browser history', () => {
    const pushState = vi.spyOn(window.history, 'pushState');
    const replaceState = vi.spyOn(window.history, 'replaceState');
    document.body.innerHTML = '<div id="modal" class="hidden"></div>';

    openModal('modal');
    closeModal('modal');

    expect(pushState).not.toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
