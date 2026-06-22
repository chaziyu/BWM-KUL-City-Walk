/* @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { closeAllModals, closeModal, createModalManager, openModal } from '../../src/ui/modal-manager.js';

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

  it('restores focus and closes the top modal once on Escape', () => {
    vi.useFakeTimers();
    document.body.innerHTML = `
      <button id="trigger">Open</button>
      <div id="first" class="hidden"><button id="firstClose">Close</button></div>
      <div id="second" class="hidden"><button id="secondClose">Close</button></div>
    `;
    const manager = createModalManager({ appRoot: document.body });
    document.getElementById('trigger').focus();

    manager.open('first');
    manager.open('second');
    document.dispatchEvent(new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    vi.advanceTimersByTime(400);

    expect(document.getElementById('second').classList.contains('hidden')).toBe(true);
    expect(document.getElementById('first').classList.contains('hidden')).toBe(false);

    manager.close('first');
    vi.advanceTimersByTime(400);
    expect(document.activeElement).toBe(document.getElementById('trigger'));
  });
});
