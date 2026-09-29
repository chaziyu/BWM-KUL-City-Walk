import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getLanguage } = require('../../api/_shared/ai/language.js');

describe('AI language detection', () => {
  it('detects Chinese text', () => {
    expect(getLanguage('独立广场有什么历史？')).toBe('zh');
  });

  it('detects common Malay phrasing', () => {
    expect(getLanguage('siapa arkitek bangunan ini')).toBe('ms');
    expect(getLanguage('berapa lama boleh melawat tempat ini')).toBe('ms');
  });

  it('defaults to English', () => {
    expect(getLanguage('Who designed Masjid Jamek?')).toBe('en');
  });
});
