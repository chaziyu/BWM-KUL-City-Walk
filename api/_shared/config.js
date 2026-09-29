function readString(name, fallback = '') {
    const value = process.env[name];
    return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

function readInteger(name, fallback, { min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER } = {}) {
    const raw = process.env[name];
    if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;

    const value = Number(raw);
    if (!Number.isFinite(value)) return fallback;
    return Math.min(max, Math.max(min, Math.trunc(value)));
}

function isProduction() {
    return process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production';
}

function useSecureCookies() {
    return isProduction() || process.env.VERCEL === '1';
}

function getRedisConfig() {
    const url = readString('KV_REST_API_URL');
    const token = readString('KV_REST_API_TOKEN');
    return {
        configured: Boolean(url && token),
        partiallyConfigured: Boolean(url || token) && !(url && token),
        url,
        token,
    };
}

module.exports = {
    getRedisConfig,
    isProduction,
    useSecureCookies,
    readInteger,
    readString,
};
