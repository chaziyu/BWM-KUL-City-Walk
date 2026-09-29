import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { isFollowUpQuery } = require('../../api/_shared/ai/history-policy.js');

describe('AI history policy', () => {
  it('keeps history for dependent follow-ups', () => {
    expect(isFollowUpQuery('tell me more')).toBe(true);
    expect(isFollowUpQuery('why?')).toBe(true);
    expect(isFollowUpQuery('what about it?')).toBe(true);
    expect(isFollowUpQuery('teruskan')).toBe(true);
    expect(isFollowUpQuery('继续说')).toBe(true);
  });

  it('drops history for standalone questions', () => {
    expect(isFollowUpQuery('Who designed Masjid Jamek?')).toBe(false);
    expect(isFollowUpQuery('What are the opening hours at Central Market?')).toBe(false);
  });
});
