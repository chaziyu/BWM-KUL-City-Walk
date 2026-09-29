import { describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  createSessionPayload,
  getSafeSessionDetails,
} = require('../../api/_shared/session.js');

describe('safe session details', () => {
  it('isolates progress storage by authenticated role', () => {
    expect(getSafeSessionDetails(createSessionPayload('demo')).progressNamespace).toBe('demo');
    expect(getSafeSessionDetails(createSessionPayload('visitor')).progressNamespace).toBe('visitor');
    expect(getSafeSessionDetails(createSessionPayload('admin')).progressNamespace).toBe('admin');
  });
});
