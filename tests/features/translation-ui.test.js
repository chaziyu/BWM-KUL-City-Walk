/* @vitest-environment jsdom */
import { describe, expect, it } from 'vitest';
import { suppressGoogleTranslatePopups } from '../../src/features/translation/translation-ui.js';

describe('Google Translate popup suppression', () => {
  it('keeps Google Translate helper and banner nodes', async () => {
    const cleanup = suppressGoogleTranslatePopups();

    const helper = document.createElement('iframe');
    helper.id = 'goog-gt-helper';
    document.body.append(helper);

    const banner = document.createElement('iframe');
    banner.className = 'goog-te-banner-frame skiptranslate';
    document.body.append(banner);

    await Promise.resolve();

    expect(document.getElementById('goog-gt-helper')).toBe(helper);
    expect(document.querySelector('.goog-te-banner-frame')).toBe(banner);

    cleanup();
  });
});
