import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parseModelResponse, SAFE_FALLBACK, validateResponse } = require('../../api/_shared/ai/response-contract.js');
const { getSiteById } = require('../../api/_shared/ai/site-catalog.js');

describe('response contract', () => {
  it('parses the compact Gemini JSON response', () => {
    expect(parseModelResponse('{"answer":"Done","sourceSiteIds":["1"],"notFound":false}')).toEqual({
      answer: 'Done',
      sourceSiteIds: ['1'],
      notFound: false,
    });
  });

  it('parses fenced JSON responses defensively', () => {
    const fenced = [
      '```json',
      '{"answer":"Done","sourceSiteIds":["1"],"notFound":false}',
      '```',
    ].join('\n');

    expect(parseModelResponse(fenced)).toEqual({
      answer: 'Done',
      sourceSiteIds: ['1'],
      notFound: false,
    });
  });

  it('extracts a JSON object wrapped in provider text', () => {
    expect(parseModelResponse('Result: {"answer":"Done","sourceSiteIds":["1"],"notFound":false}')).toEqual({
      answer: 'Done',
      sourceSiteIds: ['1'],
      notFound: false,
    });
  });

  it('rejects invalid JSON', () => {
    expect(() => parseModelResponse('plain text')).toThrow();
  });

  it('assigns confidence on the server instead of trusting the model', () => {
    const contract = { answer: 'x', sourceSiteIds: ['1'], notFound: false };
    expect(validateResponse(contract, [getSiteById('1')], 'high').confidence).toBe('high');
  });

  it('rejects unknown source IDs', () => {
    const contract = { answer: 'x', sourceSiteIds: ['999'], notFound: false };
    expect(validateResponse(contract, [getSiteById('1')], 'high')).toEqual(SAFE_FALLBACK);
  });

  it('rejects empty and duplicate source lists for factual answers', () => {
    expect(validateResponse({ answer: 'x', sourceSiteIds: [], notFound: false }, [getSiteById('1')]))
      .toEqual(SAFE_FALLBACK);
    expect(validateResponse({ answer: 'x', sourceSiteIds: ['1', '1'], notFound: false }, [getSiteById('1')]))
      .toEqual(SAFE_FALLBACK);
  });
});
