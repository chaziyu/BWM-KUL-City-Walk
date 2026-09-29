// @ts-check

/** @typedef {import('../types/domain.js').AppSession} AppSession */

import { parseApiResponse } from './api-client.js';

const DEMO_ACTIVE_KEY = 'bwm_demo_active';

/** @type {AppSession} */
const DEFAULT_SESSION = {
    authenticated: false,
    role: 'guest',
    accessType: 'guest',
    progressNamespace: null,
    chatLimit: 0,
    allowedUI: ['landing']
};

/** @type {AppSession} */
const LOCAL_DEMO_SESSION = {
    authenticated: true,
    role: 'demo',
    accessType: 'demo',
    progressNamespace: 'demo',
    chatLimit: 5,
    remainingQuota: null,
    allowedUI: ['map', 'chat', 'passport', 'challenge', 'share', 'trails'],
    localOnly: true,
};

let currentSession = { ...DEFAULT_SESSION };

function getStorage() {
    try {
        return globalThis.localStorage || null;
    } catch {
        return null;
    }
}

function setDemoActive(active) {
    const storage = getStorage();
    if (!storage) return;

    if (active) storage.setItem(DEMO_ACTIVE_KEY, '1');
    else storage.removeItem(DEMO_ACTIVE_KEY);
}

function isDemoActive() {
    return getStorage()?.getItem(DEMO_ACTIVE_KEY) === '1';
}

/**
 * @param {Partial<AppSession> | null | undefined} session
 * @returns {AppSession}
 */
function normalizeSession(session) {
    if (!session || !session.authenticated) return { ...DEFAULT_SESSION };
    const role = session.role || 'guest';
    return {
        ...DEFAULT_SESSION,
        ...session,
        role,
        progressNamespace: session.progressNamespace
            || (['demo', 'visitor', 'admin'].includes(role) ? role : 'visitor'),
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

async function requestServerDemoSession() {
    const response = await fetch('/api/session/demo', {
        method: 'POST',
        credentials: 'same-origin'
    });
    const session = setCurrentSession(await parseApiResponse(response, 'Session request failed.'));
    setDemoActive(true);
    return session;
}

/** @returns {Promise<AppSession>} */
export async function refreshSession() {
    try {
        const response = await fetch('/api/session/current', {
            method: 'GET',
            credentials: 'same-origin'
        });
        const session = setCurrentSession(await parseApiResponse(response, 'Session request failed.'));

        if (session.authenticated) {
            if (session.role === 'demo') setDemoActive(true);
            return session;
        }

        if (isDemoActive()) {
            try {
                return await requestServerDemoSession();
            } catch {
                return setCurrentSession(LOCAL_DEMO_SESSION);
            }
        }

        return session;
    } catch (error) {
        if (isDemoActive()) {
            return setCurrentSession(LOCAL_DEMO_SESSION);
        }
        throw error;
    }
}

/** @returns {Promise<AppSession>} */
export async function startDemoSession() {
    setDemoActive(true);
    const localSession = setCurrentSession(LOCAL_DEMO_SESSION);

    try {
        return await requestServerDemoSession();
    } catch {
        return localSession;
    }
}

/**
 * @param {string} passkey
 * @param {string} deviceId
 * @returns {Promise<AppSession>}
 */
export async function startVisitorSession(passkey, deviceId) {
    const response = await fetch('/api/session/visitor', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey, deviceId })
    });
    const session = setCurrentSession(await parseApiResponse(response, 'Session request failed.'));
    setDemoActive(false);
    return session;
}

/**
 * @param {string} password
 * @returns {Promise<AppSession>}
 */
export async function startAdminSession(password) {
    const response = await fetch('/api/session/admin', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    const session = setCurrentSession(await parseApiResponse(response, 'Session request failed.'));
    setDemoActive(false);
    return session;
}

/** @returns {Promise<AppSession>} */
export async function endSession() {
    try {
        await fetch('/api/session/logout', {
            method: 'POST',
            credentials: 'same-origin'
        });
    } finally {
        setDemoActive(false);
        setCurrentSession(DEFAULT_SESSION);
    }

    return currentSession;
}
