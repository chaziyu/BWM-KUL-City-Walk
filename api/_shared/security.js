function isSameOrigin(request) {
    const host = request.headers?.host;
    const origin = request.headers?.origin;
    const referer = request.headers?.referer;

    if (!host) return false;

    try {
        if (origin && new URL(origin).host === host) return true;
        if (referer && new URL(referer).host === host) return true;
    } catch {
        return false;
    }

    return false;
}

function requireSameOrigin(request, response) {
    if (isSameOrigin(request)) return true;

    response.status(403).json({
        code: 'SAME_ORIGIN_REQUIRED',
        error: 'This action is only available from the app.',
    });
    return false;
}

module.exports = {
    isSameOrigin,
    requireSameOrigin,
};
