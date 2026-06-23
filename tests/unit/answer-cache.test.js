import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  buildCacheKey,
  getCachedAnswer,
  isCacheableQuestion,
  resetAnswerCacheForTests,
  setCachedAnswer,
} = require('../../api/_shared/ai/answer-cache.js');

describe('answer cache', () => {
  it('returns cached verified answers', () => {
    resetAnswerCacheForTests();
    const key = buildCacheKey({ contextType: 'site', siteIds: ['1'], language: 'en', question: 'Who designed Sultan Abdul Samad Building?' });
    const value = { answer: 'A.B. Hubback', sourceSiteIds: ['1'], confidence: 'high', notFound: false };

    setCachedAnswer(key, value, 1000);

    expect(getCachedAnswer(key, 2000)).toEqual(value);
  });

  it('expires notFound answers sooner', () => {
    resetAnswerCacheForTests();
    const key = buildCacheKey({ contextType: 'general', siteIds: ['1'], language: 'en', question: 'missing' });
    setCachedAnswer(key, { answer: 'no', sourceSiteIds: [], confidence: 'low', notFound: true }, 1000);

    expect(getCachedAnswer(key, 1000 + 60 * 60 * 1000 + 1)).toBeNull();
  });

  it('changes key when data version changes', () => {
    const input = { contextType: 'site', siteIds: ['1'], language: 'en', question: 'Who designed Sultan Abdul Samad Building?' };

    expect(buildCacheKey({ ...input, version: 'a' })).not.toBe(buildCacheKey({ ...input, version: 'b' }));
  });

  it('skips conversation-dependent questions', () => {
    expect(isCacheableQuestion('tell me more')).toBe(false);
    expect(isCacheableQuestion('Who designed Sultan Abdul Samad Building?')).toBe(true);
  });
});
