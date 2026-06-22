/* @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest';
import { showToast } from '../../src/ui/toast.js';

describe('toast', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses textContent for messages', () => {
    showToast('<strong>Safe</strong>', { duration: 0 });

    const toast = document.getElementById('toast-region');
    expect(toast.textContent).toBe('<strong>Safe</strong>');
    expect(toast.innerHTML).toBe('&lt;strong&gt;Safe&lt;/strong&gt;');
  });

  it('creates an aria-live region', () => {
    showToast('Hello', { duration: 0 });

    expect(document.getElementById('toast-region').getAttribute('aria-live')).toBe('polite');
  });

  it('applies severity', () => {
    showToast('Saved', { duration: 0, severity: 'success' });

    const toast = document.getElementById('toast-region');
    expect(toast.dataset.severity).toBe('success');
    expect(toast.className).toContain('bg-green-50');
  });
});
