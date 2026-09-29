import { beforeEach, describe, expect, it } from 'vitest';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  consumeQuota,
  getQuotaRemaining,
  resetMemoryBucketsForTests,
} = require('../../api/_shared/rate-limit.js');

describe('quota reservations', () => {
  beforeEach(() => {
    resetMemoryBucketsForTests();
  });

  it('does not free an existing slot when an over-limit request is rejected', async () => {
    expect(await consumeQuota('test', 2)).toEqual({ exceeded: false, remaining: 1 });
    expect(await consumeQuota('test', 2)).toEqual({ exceeded: false, remaining: 0 });
    expect(await consumeQuota('test', 2)).toEqual({ exceeded: true, remaining: 0 });
    expect(await getQuotaRemaining('test', 2)).toBe(0);
  });
});
