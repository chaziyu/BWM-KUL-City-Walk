/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { STRINGS } from '../../localization.js';
import { applyBadgeStatus } from '../../src/features/passport/progress-ui.js';

describe('progress ui', () => {
  it('keeps badge stamp text short enough for the seal', () => {
    document.body.innerHTML = `
      <p id="status"></p>
      <p id="caption"></p>
      <div id="stamp"></div>
    `;

    applyBadgeStatus({
      statusDisplay: document.getElementById('status'),
      captionDisplay: document.getElementById('caption'),
      statusStamp: document.getElementById('stamp'),
      count: 1,
      total: 11,
      isComplete: false,
      strings: STRINGS,
    });

    expect(document.getElementById('stamp').textContent).toBe('BWM KL1/11');
  });
});
