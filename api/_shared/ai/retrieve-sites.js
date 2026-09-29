const { sites } = require('./site-catalog');

const STOP_WORDS = new Set([
  'about', 'and', 'are', 'can', 'did', 'does', 'for', 'how', 'is', 'me', 'of',
  'on', 'please', 'should', 'the', 'this', 'to', 'walk', 'what', 'when',
  'where', 'which', 'who', 'why', 'you', 'was', 'designed', 'designer', 'architect',
  'building', 'buildings', 'near', 'nearby', 'place', 'places', 'recommend', 'route',
  'site', 'sites', 'start', 'suggest', 'visit', 'visiting',
  'apa', 'awak', 'anda', 'boleh', 'dan', 'dengan', 'ini', 'itu', 'mana',
  'saya', 'siapa', 'tentang', 'untuk', 'yang',
]);

const MIN_SCORE = 4;
const MULTI_SITE_INTENT = /\b(compare|comparison|between|versus|vs|sites|buildings|places|near|nearby|around|which|mana|banding|dekat)\b|哪些|比較|比较|哪個|哪个|哪座|附近/;

function normalizeText(text) {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokensFor(text) {
  return normalizeText(text)
    .split(' ')
    .filter(token => token && (token.length > 2 || /[\u3400-\u9fff]/.test(token)))
    .filter(token => !STOP_WORDS.has(token));
}

function siteAliases(site) {
  return [site.name, ...(site.searchTerms || []), ...(site.aliases || [])]
    .map(normalizeText)
    .filter(Boolean);
}

function exactEntityScore(query, site) {
  let best = 0;
  siteAliases(site).forEach((alias, index) => {
    if (alias.length < 2 || !query.includes(alias)) return;
    const base = index === 0 ? 40 : 34;
    best = Math.max(best, base + Math.min(8, Math.floor(alias.length / 8)));
  });
  return best;
}

function scoreText(query, queryTokens, text, weight) {
  const value = normalizeText(text);
  if (!value) return 0;

  let score = value.includes(query) && query ? weight * 3 : 0;
  const valueTokens = new Set(value.split(' ').filter(Boolean));
  for (const token of queryTokens) {
    if (valueTokens.has(token)) score += weight;
  }
  return score;
}

function scoreSite(site, query, queryTokens) {
  const exactScore = exactEntityScore(query, site);
  const aliases = [...(site.searchTerms || []), ...(site.aliases || [])].join(' ');

  return {
    site,
    exactMatch: exactScore > 0,
    score:
      exactScore +
      scoreText(query, queryTokens, site.name, 4) +
      scoreText(query, queryTokens, aliases, 4) +
      scoreText(query, queryTokens, Object.values(site.faq || {}).join(' '), 2) +
      scoreText(query, queryTokens, site.info, 1) +
      scoreText(query, queryTokens, site.infoMore, 1) +
      scoreText(query, queryTokens, site.aiContext, 1),
  };
}

function retrieveSiteMatches(question, limit = 3) {
  const query = normalizeText(question);
  if (!query) return [];

  const queryTokens = tokensFor(question);
  const wantsMultiple = MULTI_SITE_INTENT.test(query);

  let matches = sites
    .map(site => scoreSite(site, query, queryTokens))
    .filter(result => result.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score || a.site.id.localeCompare(b.site.id));

  if (!matches.length) return [];

  const exactMatches = matches.filter(match => match.exactMatch);
  if (exactMatches.length === 1 && !wantsMultiple) {
    return exactMatches.slice(0, 1);
  }

  if (!wantsMultiple && matches.length > 1) {
    const [first, second] = matches;
    if (first.score >= 14 && first.score - second.score >= 6) {
      return [first];
    }
  }

  return matches.slice(0, limit);
}

function retrieveSites(question, limit = 3) {
  return retrieveSiteMatches(question, limit).map(result => result.site);
}

function getRetrievalConfidence(matches, contextType = 'general') {
  if (contextType === 'site') return 'high';
  if (!Array.isArray(matches) || !matches.length) return 'low';

  const [first, second] = matches;
  if (first.exactMatch && matches.length === 1) return 'high';
  if (first.score >= 14 && (!second || first.score - second.score >= 6)) return 'high';
  if (first.score >= 8) return 'medium';
  return 'low';
}

module.exports = {
  getRetrievalConfidence,
  normalizeText,
  retrieveSiteMatches,
  retrieveSites,
  tokensFor,
};
