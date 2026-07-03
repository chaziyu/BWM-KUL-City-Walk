const { Redis } = require('@upstash/redis');

// Initialize Redis if URL and token are present
let redis = null;
try {
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
        redis = new Redis({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
        });
    }
} catch (error) {
    console.warn('Failed to initialize Upstash Redis. Falling back to memory.', error?.message || 'Unknown error');
}

// In-memory fallbacks for development/missing KV
const rateBuckets = new Map();
const quotaBuckets = new Map();

/**
 * Atomic sliding window rate limiter backed by Upstash Redis (production) or memory (dev/test).
 * @param {string} key Identifier
 * @param {number} maxRequests Limit of requests in the window
 * @param {number} windowMs Window duration in milliseconds
 * @returns {Promise<{allowed: boolean, remaining: number, resetAt: number}>} Limiter state
 */
async function rateLimit(key, maxRequests, windowMs) {
    const now = Date.now();

    if (redis) {
        try {
            const redisKey = `ratelimit:${key}`;
            const result = await redis.eval(
                `
                local key = KEYS[1]
                local now = tonumber(ARGV[1])
                local windowMs = tonumber(ARGV[2])
                local maxRequests = tonumber(ARGV[3])
                local clearBefore = now - windowMs

                redis.call('ZREMRANGEBYSCORE', key, 0, clearBefore)
                local count = redis.call('ZCARD', key)

                local allowed = 0
                local remaining = 0

                if count < maxRequests then
                    allowed = 1
                    local member = tostring(now) .. '-' .. tostring(math.random())
                    redis.call('ZADD', key, now, member)
                    redis.call('PEXPIRE', key, windowMs)
                    remaining = maxRequests - count - 1
                else
                    allowed = 0
                    remaining = 0
                end

                local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
                local resetAt = now + windowMs
                if oldest and oldest[2] then
                    resetAt = tonumber(oldest[2]) + windowMs
                end

                return { allowed, remaining, resetAt }
                `,
                [redisKey],
                [now, windowMs, maxRequests]
            );

            return {
                allowed: result[0] === 1,
                remaining: result[1],
                resetAt: result[2]
            };
        } catch (error) {
            console.error('Redis rate limiting error:', error?.message || 'Unknown error');
            const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
            if (!isDevOrTest) {
                throw error;
            }
        }
    } else {
        const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
        if (!isDevOrTest) {
            throw new Error('Redis rate limit backend is unavailable in production.');
        }
    }

    // In-memory sliding window fallback (only permitted in dev/test)
    const bucket = rateBuckets.get(key) || [];
    const recent = bucket.filter(timestamp => now - timestamp < windowMs);
    const allowed = recent.length < maxRequests;
    let remaining = 0;

    if (allowed) {
        recent.push(now);
        rateBuckets.set(key, recent);
        remaining = maxRequests - recent.length;
    }

    const oldestTimestamp = recent[0] || now;
    const resetAt = oldestTimestamp + windowMs;

    return {
        allowed,
        remaining,
        resetAt
    };
}

/**
 * Backward-compatible rate limiter checking function.
 * @returns {Promise<boolean>} True if rate limited
 */
async function isRateLimited(key, maxRequests, windowMs) {
    const result = await rateLimit(key, maxRequests, windowMs);
    return !result.allowed;
}

/**
 * Validates against a quota limit for a given key over a fixed duration.
 */
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
            console.error('Redis quota error:', error?.message || 'Unknown error');
            const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
            if (!isDevOrTest) {
                throw error;
            }
        }
    } else {
        const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
        if (!isDevOrTest) {
            throw new Error('Redis quota backend is unavailable in production.');
        }
    }

    // In-memory fallback
    const count = quotaBuckets.get(key) || 0;
    if (count >= maxQuota) return true;

    quotaBuckets.set(key, count + 1);
    return false;
}

async function getQuotaRemaining(key, maxQuota) {
    if (maxQuota <= 0) return 0;

    if (redis) {
        try {
            const count = Number(await redis.get(`quota:${key}`)) || 0;
            return Math.max(0, maxQuota - count);
        } catch (error) {
            console.error('Redis quota read error:', error?.message || 'Unknown error');
            const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
            if (!isDevOrTest) {
                throw error;
            }
        }
    } else {
        const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
        if (!isDevOrTest) {
            throw new Error('Redis quota backend is unavailable in production.');
        }
    }

    return Math.max(0, maxQuota - (quotaBuckets.get(key) || 0));
}

async function consumeQuota(key, maxQuota, expireMs = 24 * 60 * 60 * 1000) {
    const exceeded = await isQuotaExceeded(key, maxQuota, expireMs);
    return {
        exceeded,
        remaining: await getQuotaRemaining(key, maxQuota),
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
            console.error('Redis quota refund error:', error?.message || 'Unknown error');
            const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
            if (!isDevOrTest) {
                throw error;
            }
        }
    } else {
        const isDevOrTest = process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' || !process.env.NODE_ENV;
        if (!isDevOrTest) {
            throw new Error('Redis quota backend is unavailable in production.');
        }
    }

    const count = quotaBuckets.get(key) || 0;
    quotaBuckets.set(key, Math.max(0, count - 1));
}

function resetMemoryBucketsForTests() {
    rateBuckets.clear();
    quotaBuckets.clear();
}

module.exports = {
    consumeQuota,
    getQuotaRemaining,
    rateLimit,
    isRateLimited,
    isQuotaExceeded,
    refundQuota,
    resetMemoryBucketsForTests
};
