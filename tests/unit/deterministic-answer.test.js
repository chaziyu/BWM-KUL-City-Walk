import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getDeterministicAnswer } = require('../../api/_shared/ai/deterministic-answer.js');

describe('deterministic heritage answers', () => {
  const site = {
    id: '1',
    name: 'Bangunan Sultan Abdul Samad',
    built: '1894-1897',
    estimatedVisitMinutes: 8,
  };

  it('answers verified construction-date questions without an LLM', () => {
    expect(getDeterministicAnswer('When was this building built?', [site])).toEqual({
      answer: '**Bangunan Sultan Abdul Samad**: 1894-1897.',
      sourceSiteIds: ['1'],
      confidence: 'high',
      notFound: false,
    });
  });

  it('answers verified visit-time questions without an LLM', () => {
    expect(getDeterministicAnswer('How long should I spend visiting this place?', [site]).answer)
      .toContain('8 minutes');
  });

  it('leaves open-ended questions for the synthesis layer', () => {
    expect(getDeterministicAnswer('Why does this building matter?', [site])).toBeNull();
    expect(getDeterministicAnswer('When was it built?', [site, { ...site, id: '2' }])).toBeNull();
  });
});
