// @ts-check

/** @typedef {import('../types/domain.js').AppSession} AppSession */

import { parseApiResponse } from './api-client.js';

/** @type {AppSession} */
const DEFAULT_SESSION = {
    authenticated: false,
    role: 'guest',
    accessType: 'guest',
    progressNamespace: null,
    chatLimit: 0,
    allowedUI: ['landing']
};

let currentSession = { ...DEFAULT_SESSION };

/**
 * @param {Partial<AppSession> | null | undefined} session
 * @returns {AppSession}
 */
function normalizeSession(session) {
    if (!session || !session.authenticated) return { ...DEFAULT_SESSION };
    return {
        ...DEFAULT_SESSION,
        ...session,
        role: session.role || 'guest',
        progressNamespace: session.progressNamespace || (['demo', 'visitor', 'admin'].includes(session.role) ? session.role : 'visitor')
    };
}

export function getCurrentSession() {
    return currentSession;
}

/**
 * @param {Partial<AppSession> | null | undefined} session
 * @returns {AppSession}
 */
export function setCurrentSession(session) {
    currentSession = normalizeSession(session);
    return currentSession;
}

export async function refreshSession() {
    const response = await fetch('/api/session/current', {
        method: 'GET',
        credentials: 'same-origin'
    });
    return setCurrentSession(await parseApiResponse(response, 'Session request failed.'));
}

export async function startDemoSession() {
    const response = await fetch('/api/session/demo', {
        method: 'POST',
        credentials: 'same-origin'
    });
    return setCurrentSession(await parseApiResponse(response, 'Session request failed.'));
}

export async function startVisitorSession(passkey, deviceId) {
    const response = await fetch('/api/session/visitor', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey, deviceId })
    });
    return setCurrentSession(await parseApiResponse(response, 'Session request failed.'));
}

export async function startAdminSession(password) {
    const response = await fetch('/api/session/admin', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    return setCurrentSession(await parseApiResponse(response, 'Session request failed.'));
}

export async function endSession() {
    await fetch('/api/session/logout', {
        method: 'POST',
        credentials: 'same-origin'
    });
    return setCurrentSession(DEFAULT_SESSION);
}
