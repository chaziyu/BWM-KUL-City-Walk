/* @vitest-environment jsdom */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAdminAccess } from '../../src/features/access/admin-access.js';

describe('admin access sharing', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="generate"></button>
      <button id="share"></button>
      <p id="status" class="hidden"></p>
      <p id="result"></p>
    `;
    globalThis.fetch = vi.fn();
    window.open = vi.fn();
  });

  it('opens mailto with the latest generated passkey', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, passkey: 'AB-12345' }),
    });
    const admin = createAdminAccess({
      strings: { auth: { adminGenSuccess: 'Generated', adminGenerateBtn: 'Generate' } },
    });

    admin.bindTools({
      generateBtn: document.getElementById('generate'),
      shareBtn: document.getElementById('share'),
      statusMsg: document.getElementById('status'),
      resultText: document.getElementById('result'),
    });

    document.getElementById('generate').click();
    await Promise.resolve();
    await Promise.resolve();
    document.getElementById('share').click();

    const url = window.open.mock.calls[0][0];
    expect(url).toContain('mailto:?subject=BWM%20KUL%20City%20Walk%20Visitor%20Passkey');
    expect(decodeURIComponent(url)).toContain('AB-12345');
    expect(decodeURIComponent(url)).toContain('Regards,\nBadan Warisan Malaysia');
  });

  it('shows a message when no generated passkey exists', () => {
    const admin = createAdminAccess({
      strings: { auth: { adminGenSuccess: 'Generated', adminGenerateBtn: 'Generate' } },
    });

    admin.bindTools({
      shareBtn: document.getElementById('share'),
      statusMsg: document.getElementById('status'),
    });

    document.getElementById('share').click();

    expect(window.open).not.toHaveBeenCalled();
    expect(document.getElementById('status').textContent).toContain('Generate a passkey');
    expect(document.getElementById('status').classList.contains('hidden')).toBe(false);
  });
});
