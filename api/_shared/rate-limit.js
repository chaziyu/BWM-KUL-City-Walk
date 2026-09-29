const { Redis } = require('@upstash/redis');
const { getRedisConfig, isProduction } = require('./config');
const { logEvent, sanitizeLogValue } = require('./observability');

let redis = null;
let degradedStorageLogged = false;

function reportDegradedStorage(reason, error) {
    if (!isProduction() || degradedStorageLogged) return;
    degradedStorageLogged = true;
    logEvent('warn', 'quota:storage-degraded', {
        backend: 'memory',
        reason,
        error: error ? sanitizeLogValue(error.message || error) : null,
    });
}

const redisConfig = getRedisConfig();
try {
    if (redisConfig.configured) {
        redis = new Redis({
            url: redisConfig.url,
            token: redisConfig.token,
        });
    } else {
        reportDegradedStorage(
            redisConfig.partiallyConfigured ? 'redis-partially-configured' : 'redis-not-configured',
        );
    }
} catch (error) {
    reportDegradedStorage('redis-initialization-failed', error);
}

const rateBuckets = new Map();
const quotaBuckets = new Map();

async function isRateLimited(key, maxRequests, windowMs) {
    const now = Date.now();

    if (redis) {
        try {
            const redisKey = `ratelimit:${key}`;
            const windowStart = now - windowMs;

            const cleanup = redis.pipeline();
            cleanup.zremrangebyscore(redisKey, 0, windowStart);
            cleanup.zcard(redisKey);
            const cleanupResults = await cleanup.exec();
            const count = Number(cleanupResults[1]) || 0;

            if (count >= maxRequests) return true;

            const record = redis.pipeline();
            record.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
            record.pexpire(redisKey, windowMs);
            await record.exec();
            return false;
        } catch (error) {
            logEvent('error', 'quota:redis-rate-limit-error', {
                message: sanitizeLogValue(error.message || error),
            });
            reportDegradedStorage('redis-rate-limit-error', error);
        }
    }

    const bucket = rateBuckets.get(key) || [];
    const recent = bucket.filter(timestamp => now - timestamp < windowMs);

    if (recent.length >= maxRequests) {
        rateBuckets.set(key, recent);
        return true;
    }

    recent.push(now);
    rateBuckets.set(key, recent);
    return false;
}

async function isQuotaExceeded(key, maxQuota, expireMs = 24 * 60 * 60 * 1000) {
    if (maxQuota <= 0) return true;

    if (redis) {
        try {
            const redisKey = `quota:${key}`;
            const count = await redis.incr(redisKey);

            if (count === 1 && expireMs) {
                await redis.pexpire(redisKey, expireMs);
            }

            return count > maxQuota;
        } catch (error) {
            logEvent('error', 'quota:redis-consume-error', {
                message: sanitizeLogValue(error.message || error),
            });
            reportDegradedStorage('redis-consume-error', error);
        }
    }

    const count = quotaBuckets.get(key) || 0;
    const nextCount = count + 1;
    quotaBuckets.set(key, nextCount);
    return nextCount > maxQuota;
}

async function getQuotaRemaining(key, maxQuota) {
    if (maxQuota <= 0) return 0;

    if (redis) {
        try {
            const count = Number(await redis.get(`quota:${key}`)) || 0;
            return Math.max(0, maxQuota - count);
        } catch (error) {
            logEvent('error', 'quota:redis-read-error', {
                message: sanitizeLogValue(error.message || error),
            });
            reportDegradedStorage('redis-read-error', error);
        }
    }

    return Math.max(0, maxQuota - (quotaBuckets.get(key) || 0));
}

async function consumeQuota(key, maxQuota, expireMs = 24 * 60 * 60 * 1000) {
    if (maxQuota <= 0) {
        return { exceeded: true, remaining: 0 };
    }

    if (redis) {
        try {
            const redisKey = `quota:${key}`;
            const count = Number(await redis.incr(redisKey));

            if (count === 1 && expireMs) {
                await redis.pexpire(redisKey, expireMs);
            }

            if (count > maxQuota) {
                await redis.decr(redisKey);
                return { exceeded: true, remaining: 0 };
            }

            return {
                exceeded: false,
                remaining: Math.max(0, maxQuota - count),
            };
        } catch (error) {
            logEvent('error', 'quota:redis-consume-error', {
                message: sanitizeLogValue(error.message || error),
            });
            reportDegradedStorage('redis-consume-error', error);
        }
    }

    const count = quotaBuckets.get(key) || 0;
    if (count >= maxQuota) {
        return { exceeded: true, remaining: 0 };
    }

    const nextCount = count + 1;
    quotaBuckets.set(key, nextCount);
    return {
        exceeded: false,
        remaining: Math.max(0, maxQuota - nextCount),
    };
}

async function refundQuota(key) {
    if (redis) {
        try {
            const redisKey = `quota:${key}`;
            const count = Number(await redis.decr(redisKey));
            if (count < 0) await redis.set(redisKey, 0);
            return;
        } catch (error) {
            logEvent('error', 'quota:redis-refund-error', {
                message: sanitizeLogValue(error.message || error),
            });
            reportDegradedStorage('redis-refund-error', error);
        }
    }

    const count = quotaBuckets.get(key) || 0;
    quotaBuckets.set(key, Math.max(0, count - 1));
}

function resetMemoryBucketsForTests() {
    rateBuckets.clear();
    quotaBuckets.clear();
    degradedStorageLogged = false;
}

module.exports = {
    consumeQuota,
    getQuotaRemaining,
    isRateLimited,
    isQuotaExceeded,
    refundQuota,
    resetMemoryBucketsForTests,
};
