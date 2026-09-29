const crypto = require('crypto');

function sanitizeLogValue(value, maxLength = 300) {
    return String(value ?? '')
        .replace(/[\r\n\t]+/g, ' ')
        .trim()
        .slice(0, maxLength);
}

function getRequestId(request) {
    const candidate = request.headers?.['x-request-id']
        || request.headers?.['x-vercel-id'];

    if (candidate) return sanitizeLogValue(candidate, 120);
    return crypto.randomUUID();
}

function attachRequestContext(request, response) {
    const requestId = getRequestId(request);
    response.setHeader?.('X-Request-Id', requestId);
    return requestId;
}

function logEvent(level, event, fields = {}) {
    const logger = console[level] || console.info;
    logger(`[${event}]`, fields);
}

module.exports = {
    attachRequestContext,
    logEvent,
    sanitizeLogValue,
};
