const crypto = require('crypto');

const COOKIE_NAME = 'bwm_session';
const ROLE_LIMITS = {
    demo: Number(process.env.DEMO_CHAT_LIMIT) || 5,
    visitor: Number(process.env.VISITOR_CHAT_LIMIT) || 15,
    admin: Number(process.env.ADMIN_CHAT_LIMIT) || 30
};

function getSessionSecret() {
    if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
    if (process.env.NODE_ENV !== 'production') {
        console.warn('SESSION_SECRET is not set. Using a local development-only fallback.');
        return 'bwm-local-development-session-secret';
    }
    throw new Error('SESSION_SECRET is not configured.');
}

function base64url(input) {
    return Buffer.from(input)
        .toString('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function fromBase64url(input) {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(normalized, 'base64').toString('utf8');
}

function sign(value) {
    return crypto
        .createHmac('sha256', getSessionSecret())
        .update(value)
        .digest('base64')
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_');
}

function parseCookies(cookieHeader = '') {
    return cookieHeader.split(';').reduce((cookies, pair) => {
        const index = pair.indexOf('=');
        if (index === -1) return cookies;
        const key = pair.slice(0, index).trim();
        const value = pair.slice(index + 1).trim();
        if (key) cookies[key] = decodeURIComponent(value);
        return cookies;
    }, {});
}

function getCookieOptions(maxAge) {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
    return [
        'HttpOnly',
        'SameSite=Lax',
        'Path=/',
        `Max-Age=${Math.max(0, Math.floor(maxAge))}`,
        isProduction ? 'Secure' : ''
    ].filter(Boolean).join('; ');
}

function createSessionPayload(role, options = {}) {
    const now = Date.now();
    const maxAge = Number(options.maxAge) || 60 * 60;
    const accessType = options.accessType || role;

    return {
        role,
        accessType,
        issuedAt: now,
        expiresAt: now + maxAge * 1000,
        sessionId: crypto.randomBytes(16).toString('hex')
    };
}

function encodeSession(payload) {
    const encodedPayload = base64url(JSON.stringify(payload));
    return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifySessionCookie(cookieValue) {
    if (!cookieValue || typeof cookieValue !== 'string') return null;
    const [encodedPayload, signature] = cookieValue.split('.');
    if (!encodedPayload || !signature) return null;
    const expectedSignature = sign(encodedPayload);
    const provided = Buffer.from(signature);
    const expected = Buffer.from(expectedSignature);
    if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) return null;

    try {
        const payload = JSON.parse(fromBase64url(encodedPayload));
        if (!payload?.role || !payload?.expiresAt) return null;
        if (Date.now() > Number(payload.expiresAt)) return null;
        if (!['demo', 'visitor', 'admin'].includes(payload.role)) return null;
        return payload;
    } catch (error) {
        return null;
    }
}

function getSessionFromRequest(request) {
    const cookies = parseCookies(request.headers?.cookie || '');
    return verifySessionCookie(cookies[COOKIE_NAME]);
}

function setSessionCookie(response, payload, maxAge) {
    response.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(encodeSession(payload))}; ${getCookieOptions(maxAge)}`);
}

function clearSessionCookie(response) {
    response.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${getCookieOptions(0)}`);
}

function getSafeSessionDetails(session) {
    if (!session) {
        return {
            authenticated: false,
            role: 'guest',
            accessType: 'guest',
            progressNamespace: null,
            chatLimit: 0,
            allowedUI: ['landing']
        };
    }

    const progressNamespace = session.role === 'demo' ? 'demo' : 'visitor';
    const allowedUI = session.role === 'admin'
        ? ['admin', 'map', 'chat']
        : ['map', 'chat', 'passport', 'challenge', 'share'];

    return {
        authenticated: true,
        role: session.role,
        accessType: session.accessType,
        progressNamespace,
        chatLimit: ROLE_LIMITS[session.role] || 0,
        allowedUI,
        expiresAt: session.expiresAt
    };
}

function requireRole(request, allowedRoles) {
    const session = getSessionFromRequest(request);
    if (!session || !allowedRoles.includes(session.role)) {
        return null;
    }
    return session;
}

module.exports = {
    COOKIE_NAME,
    ROLE_LIMITS,
    clearSessionCookie,
    createSessionPayload,
    getSafeSessionDetails,
    getSessionFromRequest,
    requireRole,
    setSessionCookie
};
