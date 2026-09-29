import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { getDeterministicAnswer } = require('../../api/_shared/ai/deterministic-answer.js');

describe('deterministic heritage answers', () => {
  const site = {
    id: '1',
    name: 'Bangunan Sultan Abdul Samad',
    built: '1894-1897',
    architects: 'A.C. Norman, R.A.J. Bidwell, A.B. Hubback',
    estimatedVisitMinutes: 8,
    faq: {
      openingHours: 'Exterior viewable 24 hours. Interior restricted.',
      ticketFee: 'Free (Exterior)',
      tips: 'Best photo spot is across the street.',
    },
  };

  it('answers verified construction-date questions without an LLM', () => {
    expect(getDeterministicAnswer('When was this building built?', [site])).toEqual({
      answer: '**Bangunan Sultan Abdul Samad**: 1894-1897.',
      sourceSiteIds: ['1'],
      confidence: 'high',
      notFound: false,
    });
  });

  it('answers architect, hours, fees, visit-time, and tip questions without an LLM', () => {
    expect(getDeterministicAnswer('Who designed this building?', [site]).answer).toContain('A.B. Hubback');
    expect(getDeterministicAnswer('What are the opening hours?', [site]).answer).toContain('24 hours');
    expect(getDeterministicAnswer('Is entry free?', [site]).answer).toContain('Free');
    expect(getDeterministicAnswer('How long should I spend visiting this place?', [site]).answer).toContain('8 minutes');
    expect(getDeterministicAnswer('Any tips before I visit?', [site]).answer).toContain('Best photo spot');
  });

  it('answers supported Malay and Chinese factual questions locally', () => {
    expect(getDeterministicAnswer('siapa arkitek bangunan ini?', [site]).answer).toContain('direka oleh');
    expect(getDeterministicAnswer('这个地方的门票免费吗？', [site]).answer).toContain('门票或入场费用');
  });

  it('leaves open-ended questions for the synthesis layer', () => {
    expect(getDeterministicAnswer('Why does this building matter?', [site])).toBeNull();
    expect(getDeterministicAnswer('When was it built?', [site, { ...site, id: '2' }])).toBeNull();
  });
});
