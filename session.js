const DEFAULT_SESSION = {
    authenticated: false,
    role: 'guest',
    accessType: 'guest',
    progressNamespace: null,
    chatLimit: 0,
    allowedUI: ['landing']
};

let currentSession = { ...DEFAULT_SESSION };

async function parseJson(response) {
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(data.error || data.reply || 'Session request failed.');
    }
    return data;
}

function normalizeSession(session) {
    if (!session || !session.authenticated) return { ...DEFAULT_SESSION };
    return {
        ...DEFAULT_SESSION,
        ...session,
        role: session.role || 'guest',
        progressNamespace: session.progressNamespace || (session.role === 'demo' ? 'demo' : 'visitor')
    };
}

export function getCurrentSession() {
    return currentSession;
}

export function setCurrentSession(session) {
    currentSession = normalizeSession(session);
    return currentSession;
}

export async function refreshSession() {
    const response = await fetch('/api/session/current', {
        method: 'GET',
        credentials: 'same-origin'
    });
    return setCurrentSession(await parseJson(response));
}

export async function startDemoSession() {
    const response = await fetch('/api/session/demo', {
        method: 'POST',
        credentials: 'same-origin'
    });
    return setCurrentSession(await parseJson(response));
}

export async function startVisitorSession(passkey, deviceId) {
    const response = await fetch('/api/session/visitor', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey, deviceId })
    });
    return setCurrentSession(await parseJson(response));
}

export async function startAdminSession(password) {
    const response = await fetch('/api/session/admin', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    return setCurrentSession(await parseJson(response));
}

export async function endSession() {
    await fetch('/api/session/logout', {
        method: 'POST',
        credentials: 'same-origin'
    });
    return setCurrentSession(DEFAULT_SESSION);
}
