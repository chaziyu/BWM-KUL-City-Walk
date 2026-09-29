import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  CHAT_MODELS,
  PRIMARY_CHAT_MODEL,
  shouldTryFallback,
  supportsJsonMode,
} = require('../../api/_shared/ai/model-config.js');

describe('AI model configuration', () => {
  it('uses Flash-Lite as primary with one structured Flash-Lite fallback', () => {
    expect(PRIMARY_CHAT_MODEL).toBe('gemini-3.5-flash-lite');
    expect(CHAT_MODELS).toEqual([
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
    ]);
  });

  it('uses structured JSON mode for configured models', () => {
    expect(CHAT_MODELS.every(supportsJsonMode)).toBe(true);
  });

  it('only falls back for transient provider failures', () => {
    expect(shouldTryFallback(Object.assign(new Error('unavailable'), { status: 503 }))).toBe(true);
    expect(shouldTryFallback(Object.assign(new Error('bad request'), { status: 400 }))).toBe(false);
    expect(shouldTryFallback(new SyntaxError('bad json'))).toBe(false);
  });
});
