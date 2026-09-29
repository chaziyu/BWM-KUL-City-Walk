const { getRedisConfig, readString } = require('./_shared/config');
const { requireMethod } = require('./_shared/http');
const { attachRequestContext } = require('./_shared/observability');

module.exports = async (request, response) => {
    attachRequestContext(request, response);
    if (!requireMethod(request, response, 'GET')) return;

    const redis = getRedisConfig();
    return response.status(200).json({
        status: 'ok',
        services: {
            aiConfigured: Boolean(readString('GOOGLE_API_KEY')),
            redisConfigured: redis.configured,
            visitorServiceConfigured: Boolean(readString('GOOGLE_SCRIPT_URL')),
            sessionSecretConfigured: Boolean(readString('SESSION_SECRET')),
        },
    });
};
