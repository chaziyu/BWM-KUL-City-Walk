import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { CHAT_MODELS, supportsJsonMode } = require('../../api/_shared/ai/model-config.js');

describe('AI model configuration', () => {
  it('keeps the approved fallback order without Gemini 2.5 models', () => {
    expect(CHAT_MODELS).toEqual([
      'gemini-3.5-flash-lite',
      'gemma-4-26b-a4b-it',
      'gemma-4-31b-it',
    ]);
  });

  it('uses structured JSON mode only for Gemini models', () => {
    expect(supportsJsonMode('gemini-3.5-flash-lite')).toBe(true);
    expect(supportsJsonMode('gemma-4-26b-a4b-it')).toBe(false);
  });
});
