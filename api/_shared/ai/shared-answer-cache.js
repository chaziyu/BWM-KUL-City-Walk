const crypto = require('crypto');
const { Redis } = require('@upstash/redis');
const { getRedisConfig } = require('../config');
const { logEvent, sanitizeLogValue } = require('../observability');
const { getCachedAnswer, setCachedAnswer } = require('./answer-cache');

let redis = null;
let redisIdentity = '';

function getRedisClient() {
  const config = getRedisConfig();
  if (!config.configured) return null;

  const identity = `${config.url}|${config.token}`;
  if (!redis || redisIdentity !== identity) {
    redis = new Redis({ url: config.url, token: config.token });
    redisIdentity = identity;
  }

  return redis;
}

function sharedKey(key) {
  const hash = crypto.createHash('sha256').update(String(key)).digest('hex');
  return `ai-answer:${hash}`;
}

function ttlSeconds(value) {
  return value?.notFound ? 60 * 60 : 24 * 60 * 60;
}

async function getSharedCachedAnswer(key, now = Date.now()) {
  const local = getCachedAnswer(key, now);
  if (local) return local;

  const client = getRedisClient();
  if (!client) return null;

  try {
    const stored = await client.get(sharedKey(key));
    if (!stored) return null;

    const value = typeof stored === 'string' ? JSON.parse(stored) : stored;
    if (!value || typeof value !== 'object') return null;

    setCachedAnswer(key, value, now);
    return value;
  } catch (error) {
    logEvent('warn', 'chat:shared-cache-read-failed', {
      message: sanitizeLogValue(error?.message || error),
    });
    return null;
  }
}

async function setSharedCachedAnswer(key, value, now = Date.now()) {
  setCachedAnswer(key, value, now);

  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(sharedKey(key), JSON.stringify(value), { ex: ttlSeconds(value) });
  } catch (error) {
    logEvent('warn', 'chat:shared-cache-write-failed', {
      message: sanitizeLogValue(error?.message || error),
    });
  }
}

function resetSharedAnswerCacheForTests() {
  redis = null;
  redisIdentity = '';
}

module.exports = {
  getSharedCachedAnswer,
  resetSharedAnswerCacheForTests,
  setSharedCachedAnswer,
  sharedKey,
};
