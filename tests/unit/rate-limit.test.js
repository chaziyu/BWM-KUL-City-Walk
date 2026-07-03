import { describe, expect, it, beforeEach } from 'vitest';
import { rateLimit, resetMemoryBucketsForTests } from '../../api/_shared/rate-limit.js';

describe('rateLimiter service', () => {
    beforeEach(() => {
        resetMemoryBucketsForTests();
        process.env.NODE_ENV = 'test';
    });

    it('enforces the limit using the in-memory fallback', async () => {
        const key = 'test-ip-memory';
        const limit = 3;
        const windowMs = 5000;

        // First 3 requests allowed
        const r1 = await rateLimit(key, limit, windowMs);
        expect(r1.allowed).toBe(true);
        expect(r1.remaining).toBe(2);

        const r2 = await rateLimit(key, limit, windowMs);
        expect(r2.allowed).toBe(true);
        expect(r2.remaining).toBe(1);

        const r3 = await rateLimit(key, limit, windowMs);
        expect(r3.allowed).toBe(true);
        expect(r3.remaining).toBe(0);

        // 4th request rejected
        const r4 = await rateLimit(key, limit, windowMs);
        expect(r4.allowed).toBe(false);
        expect(r4.remaining).toBe(0);

        // Repeated rejected attempts do not extend/reset original window
        const r5 = await rateLimit(key, limit, windowMs);
        expect(r5.allowed).toBe(false);
    });

    it('accepts exactly 10 requests out of 20 concurrent requests when limit is 10', async () => {
        const key = 'test-concurrent';
        const limit = 10;
        const windowMs = 10000;

        const promises = [];
        for (let i = 0; i < 20; i++) {
            promises.push(rateLimit(key, limit, windowMs));
        }

        const results = await Promise.all(promises);
        const allowedCount = results.filter(r => r.allowed).length;
        const rejectedCount = results.filter(r => !r.allowed).length;

        expect(allowedCount).toBe(10);
        expect(rejectedCount).toBe(10);
    });

    it('fails-fast and throws an error when Redis is missing or fails in production', async () => {
        process.env.NODE_ENV = 'production';
        const key = 'test-ip-prod-fail';
        
        await expect(rateLimit(key, 5, 1000)).rejects.toThrow();
    });
});
