const { sites } = require('./site-catalog');

const STOP_WORDS = new Set([
    'about', 'and', 'are', 'can', 'did', 'does', 'for', 'how', 'is', 'me', 'of',
    'on', 'please', 'should', 'the', 'this', 'to', 'walk', 'what', 'when',
    'where', 'which', 'who', 'why', 'you', 'designed', 'designer', 'architect',
]);
const MIN_SCORE = 4;

function normalizeText(text) {
    return String(text || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, ' ')
        .trim()
        .replace(/\s+/g, ' ');
}

function tokensFor(text) {
    return normalizeText(text).split(' ').filter(token => token.length > 2 && !STOP_WORDS.has(token));
}

function scoreText(query, queryTokens, text, weight) {
    const value = normalizeText(text);
    if (!value) return 0;

    let score = value.includes(query) && query ? weight * 3 : 0;
    for (const token of queryTokens) {
        if (value.includes(token)) score += weight;
    }
    return score;
}

function retrieveSites(question, limit = 3) {
    const query = normalizeText(question);
    const queryTokens = tokensFor(question);
    if (!queryTokens.length) return [];

    return sites
        .map(site => ({
            site,
            score:
                scoreText(query, queryTokens, site.name, 4) +
                scoreText(query, queryTokens, site.searchTerms.join(' '), 4) +
                scoreText(query, queryTokens, site.faq, 2) +
                scoreText(query, queryTokens, site.info, 1) +
                scoreText(query, queryTokens, site.infoMore, 1) +
                scoreText(query, queryTokens, site.aiContext, 1),
        }))
        .filter(result => result.score >= MIN_SCORE)
        .sort((a, b) => b.score - a.score || a.site.id.localeCompare(b.site.id))
        .slice(0, limit)
        .map(result => result.site);
}

module.exports = {
    normalizeText,
    retrieveSites,
};
