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
    console.warn('Failed to initialize Upstash Redis. Falling back to memory.', error);
}

// In-memory fallbacks for development/missing KV
const rateBuckets = new Map();
const quotaBuckets = new Map();

/**
 * Validates against a sliding window rate limit.
 * @param {string} key Identifier (e.g., IP address)
 * @param {number} maxRequests Max requests allowed in the window
 * @param {number} windowMs Window length in milliseconds
 * @returns {Promise<boolean>} True if rate limited (exceeded max)
 */
async function isRateLimited(key, maxRequests, windowMs) {
    const now = Date.now();
    
    if (redis) {
        try {
            // Redis sorted set approach for sliding window
            const redisKey = `ratelimit:${key}`;
            const windowStart = now - windowMs;
            
            const pipeline = redis.pipeline();
            pipeline.zremrangebyscore(redisKey, 0, windowStart);
            pipeline.zcard(redisKey);
            pipeline.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
            pipeline.pexpire(redisKey, windowMs);
            
            const results = await pipeline.exec();
            const count = results[1]; // The zcard result
            
            return count >= maxRequests;
        } catch (error) {
            console.error('Redis rate limiting error, falling back to memory:', error);
        }
    }

    // In-memory fallback
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

/**
 * Validates against a quota limit for a given key over a fixed duration.
 * @param {string} key Unique identifier for the quota bucket (e.g., session + date)
 * @param {number} maxQuota Max items allowed in the quota
 * @param {number} expireMs Optional expiration for the quota bucket
 * @returns {Promise<boolean>} True if quota exceeded
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
            console.error('Redis quota error, falling back to memory:', error);
        }
    }

    // In-memory fallback
    const count = quotaBuckets.get(key) || 0;
    if (count >= maxQuota) return true;

    quotaBuckets.set(key, count + 1);
    return false;
}

module.exports = {
    isRateLimited,
    isQuotaExceeded
};
