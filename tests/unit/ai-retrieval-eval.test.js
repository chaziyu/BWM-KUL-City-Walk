import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { retrieveSites } = require('../../api/_shared/ai/retrieve-sites.js');

const CASES = [
  ['Who designed Masjid Jamek?', '4'],
  ['Tell me about the old market square', '5'],
  ['Who was Yap Ah Loy?', 'E'],
  ['Sze Ya Temple history', '6'],
  ['Apakah sejarah Pejabat Pos Lama?', '2'],
  ['siapa arkitek Masjid Jamek?', '4'],
  ['独立广场有什么历史？', 'A'],
  ['谁设计了占美清真寺？', '4'],
  ['中央市场几点开？', 'D'],
  ['仙四师爷庙门票多少钱？', '6'],
];

describe('AI retrieval regression set', () => {
  it.each(CASES)('routes "%s" to site %s', (question, expectedSiteId) => {
    expect(retrieveSites(question).map(site => site.id)[0]).toBe(expectedSiteId);
  });

  it('does not ground unrelated financial advice in heritage data', () => {
    expect(retrieveSites('What stock should I buy tomorrow?')).toEqual([]);
  });
});
