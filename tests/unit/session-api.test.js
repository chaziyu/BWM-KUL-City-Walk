import { describe, expect, it, vi, beforeEach } from 'vitest';
import visitorHandler from '../../api/session/visitor.js';
import adminHandler from '../../api/session/admin.js';
import demoHandler from '../../api/session/demo.js';
import logoutHandler from '../../api/session/logout.js';
import generatePasskeyHandler from '../../api/admin/generate-passkey.js';

function mockRequestResponse({ headers = {}, body = {}, method = 'POST', url = '/api/session/visitor' }) {
    const req = {
        headers: {
            host: 'example.com',
            ...headers
        },
        body,
        method,
        url,
        socket: { remoteAddress: '127.0.0.1' }
    };

    let statusVal = 200;
    let jsonVal = null;
    const resHeaders = {};

    const res = {
        status(code) {
            statusVal = code;
            return this;
        },
        json(data) {
            jsonVal = data;
            return this;
        },
        setHeader(name, value) {
            resHeaders[name] = value;
            return this;
        },
        cookie() {}
    };

    return { req, res, getStatus: () => statusVal, getJson: () => jsonVal, getHeaders: () => resHeaders };
}

describe('Session APIs Security and Error Mapping', () => {
    beforeEach(() => {
        process.env.NODE_ENV = 'test';
        process.env.GOOGLE_SCRIPT_URL = 'http://test-script-url';
    });

    describe('Origin Verification', () => {
        it('blocks cross-origin requests for visitor session', async () => {
            const { req, res, getStatus, getJson } = mockRequestResponse({
                headers: {
                    origin: 'https://malicious.com',
                },
                body: { passkey: 'TEST-KEY', deviceId: 'DEV-1' }
            });

            await visitorHandler(req, res);
            expect(getStatus()).toBe(403);
            expect(getJson()).toEqual({ error: 'Request blocked' });
        });

        it('blocks cross-origin requests for admin session', async () => {
            const { req, res, getStatus, getJson } = mockRequestResponse({
                headers: {
                    origin: 'https://malicious.com',
                },
                url: '/api/session/admin'
            });

            await adminHandler(req, res);
            expect(getStatus()).toBe(403);
            expect(getJson()).toEqual({ error: 'Request blocked' });
        });

        it('blocks cross-origin requests for demo session', async () => {
            const { req, res, getStatus, getJson } = mockRequestResponse({
                headers: {
                    origin: 'https://malicious.com',
                },
                url: '/api/session/demo'
            });

            await demoHandler(req, res);
            expect(getStatus()).toBe(403);
            expect(getJson()).toEqual({ error: 'Request blocked' });
        });

        it('blocks cross-origin requests for logout', async () => {
            const { req, res, getStatus, getJson } = mockRequestResponse({
                headers: {
                    origin: 'https://malicious.com',
                },
                url: '/api/session/logout'
            });

            await logoutHandler(req, res);
            expect(getStatus()).toBe(403);
            expect(getJson()).toEqual({ error: 'Request blocked' });
        });
    });

    describe('Visitor Passkey Validation Error Mapping', () => {
        it('returns 504 when Apps Script validator times out', async () => {
            const { req, res, getStatus, getJson } = mockRequestResponse({
                headers: {
                    origin: 'https://example.com',
                },
                body: { passkey: 'ABCD-EFGH', deviceId: 'DEV-1' }
            });

            const originalFetch = globalThis.fetch;
            globalThis.fetch = vi.fn().mockImplementation(() => {
                return new Promise((_, reject) => {
                    const abortError = new Error('The user aborted a request.');
                    abortError.name = 'AbortError';
                    reject(abortError);
                });
            });

            try {
                await visitorHandler(req, res);
                expect(getStatus()).toBe(504);
                expect(getJson()).toEqual({ error: 'Service took too long; please retry' });
            } finally {
                globalThis.fetch = originalFetch;
            }
        });

        it('returns 502 when Apps Script validator returns an error or status is not ok', async () => {
            const { req, res, getStatus, getJson } = mockRequestResponse({
                headers: {
                    origin: 'https://example.com',
                },
                body: { passkey: 'ABCD-EFGH', deviceId: 'DEV-1' }
            });

            const originalFetch = globalThis.fetch;
            globalThis.fetch = vi.fn().mockResolvedValue({
                ok: false,
                status: 500,
            });

            try {
                await visitorHandler(req, res);
                expect(getStatus()).toBe(502);
                expect(getJson()).toEqual({ error: 'Service could not complete the request' });
            } finally {
                globalThis.fetch = originalFetch;
            }
        });
    });
});
