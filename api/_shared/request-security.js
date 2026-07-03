function isSameOrigin(request) {
    const host = request.headers.host;
    const origin = request.headers.origin;
    const referer = request.headers.referer;

    try {
        if (origin && new URL(origin).host === host) return true;
        if (referer && new URL(referer).host === host) return true;
    } catch (e) {
        return false;
    }

    return false;
}

function enforceSameOrigin(request, response) {
    if (!isSameOrigin(request)) {
        const isChat = request.url?.includes('/chat');
        if (isChat) {
            response.status(403).json({ reply: 'Request blocked' });
        } else {
            response.status(403).json({ error: 'Request blocked' });
        }
        return false;
    }
    return true;
}

module.exports = {
    isSameOrigin,
    enforceSameOrigin
};
