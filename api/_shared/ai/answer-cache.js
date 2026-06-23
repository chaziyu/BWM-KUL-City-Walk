const { knowledgeVersion } = require('./site-catalog');
const { normalizeText } = require('./retrieve-sites');

const cache = new Map();

function getLanguage(question) {
    return /[\u3400-\u9fff]/.test(String(question || '')) ? 'zh' : 'en';
}

function isCacheableQuestion(question) {
    return !/^\s*(tell me more|more|continue|what about that|and then)\b/i.test(String(question || ''));
}

function buildCacheKey({ contextType, siteIds, language, question, version = knowledgeVersion }) {
    return [
        version,
        contextType || 'general',
        [...siteIds].sort().join(','),
        language || getLanguage(question),
        normalizeText(question),
    ].join('|');
}

function getCachedAnswer(key, now = Date.now()) {
    const hit = cache.get(key);
    if (!hit || hit.expiresAt <= now) {
        cache.delete(key);
        return null;
    }
    return hit.value;
}

function setCachedAnswer(key, value, now = Date.now()) {
    const ttl = value.notFound ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    cache.set(key, { value, expiresAt: now + ttl });
}

function resetAnswerCacheForTests() {
    cache.clear();
}

module.exports = {
    buildCacheKey,
    getCachedAnswer,
    getLanguage,
    isCacheableQuestion,
    resetAnswerCacheForTests,
    setCachedAnswer,
};
