function getClientIp(request) {
    const forwardedFor = request.headers?.['x-forwarded-for'];
    const value = Array.isArray(forwardedFor)
        ? forwardedFor[0]
        : (forwardedFor || request.socket?.remoteAddress || 'unknown');
    return String(value).split(',')[0].trim();
}

function requireMethod(request, response, method) {
    if (request.method === method) return true;
    response.setHeader?.('Allow', method);
    response.status(405).json({
        code: 'METHOD_NOT_ALLOWED',
        error: 'Method not allowed',
    });
    return false;
}

function sendError(response, status, code, message, extra = {}) {
    return response.status(status).json({
        code,
        error: message,
        ...extra,
    });
}

module.exports = {
    getClientIp,
    requireMethod,
    sendError,
};
