import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseModelResponse, SAFE_FALLBACK, validateResponse } = require('../../api/_shared/ai/response-contract.js');
const { getSiteById } = require('../../api/_shared/ai/site-catalog.js');

describe('response contract', () => {
  it('parses Gemini JSON responses', () => {
    expect(parseModelResponse('{"answer":"Done","sourceSiteIds":["1"],"confidence":"high","notFound":false}')).toEqual({
      answer: 'Done',
      sourceSiteIds: ['1'],
      confidence: 'high',
      notFound: false,
    });
  });

  it('rejects invalid JSON', () => {
    expect(() => parseModelResponse('plain text')).toThrow();
  });

  it('rejects unknown source IDs', () => {
    const contract = { answer: 'x', sourceSiteIds: ['999'], confidence: 'high', notFound: false };

    expect(validateResponse(contract, [getSiteById('1')])).toEqual(SAFE_FALLBACK);
  });

  it('rejects empty source lists for factual answers', () => {
    const contract = { answer: 'x', sourceSiteIds: [], confidence: 'high', notFound: false };

    expect(validateResponse(contract, [getSiteById('1')])).toEqual(SAFE_FALLBACK);
  });

  it('rejects duplicate source IDs', () => {
    const contract = { answer: 'x', sourceSiteIds: ['1', '1'], confidence: 'high', notFound: false };

    expect(validateResponse(contract, [getSiteById('1')])).toEqual(SAFE_FALLBACK);
  });
});
