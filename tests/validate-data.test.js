import { describe, expect, it } from 'vitest';
import validator from '../scripts/validate-data.js';

describe('data validation', () => {
  it('passes the current heritage site data set', () => {
    const result = validator.validateSites();

    expect(result.ok, result.errors.join('\n')).toBe(true);
    expect(result.counts.must_visit).toBe(11);
    expect(result.counts.total).toBeGreaterThan(result.counts.must_visit);
  });
});
