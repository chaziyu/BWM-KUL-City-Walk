import { describe, expect, it, vi } from 'vitest';
import { fetchJsonWithTimeout, withTimeout } from '../../api/_shared/http.js';

describe('HTTP and Timeout Helpers', () => {
    describe('withTimeout', () => {
        it('resolves if the promise completes before the timeout', async () => {
            const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 10));
            const result = await withTimeout(promise, 50);
            expect(result).toBe('success');
        });

        it('rejects with timeout error if the promise takes too long', async () => {
            const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
            await expect(withTimeout(promise, 20)).rejects.toThrow('Service took too long; please retry');
        });

        it('propagates the original rejection if the promise rejects first', async () => {
            const promise = Promise.reject(new Error('custom error'));
            await expect(withTimeout(promise, 50)).rejects.toThrow('custom error');
        });
    });

    describe('fetchJsonWithTimeout', () => {
        it('resolves parsed json when fetch is successful', async () => {
            const mockResponse = { data: 'test' };
            const originalFetch = globalThis.fetch;
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: true,
                json: async () => mockResponse,
            });

            try {
                const result = await fetchJsonWithTimeout('https://api.example.com', {}, 1000);
                expect(result).toEqual(mockResponse);
            } finally {
                globalThis.fetch = originalFetch;
            }
        });

        it('rejects with 504 on abort/timeout', async () => {
            const originalFetch = globalThis.fetch;
            // Mock fetch to simulate an AbortError when signal is aborted
            globalThis.fetch = vi.fn().mockImplementation((url, init) => {
                return new Promise((_, reject) => {
                    const abortError = new Error('The user aborted a request.');
                    abortError.name = 'AbortError';

                    if (init?.signal?.aborted) {
                        reject(abortError);
                    } else if (init?.signal) {
                        init.signal.addEventListener('abort', () => reject(abortError));
                    }
                });
            });

            try {
                await expect(fetchJsonWithTimeout('https://api.example.com', {}, 50)).rejects.toThrow('Service took too long; please retry');
            } finally {
                globalThis.fetch = originalFetch;
            }
        });
    });
});
