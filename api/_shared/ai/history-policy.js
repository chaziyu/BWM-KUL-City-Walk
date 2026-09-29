const { normalizeText } = require('./retrieve-sites');

const FOLLOW_UP_PHRASES = [
  /^more\b/,
  /^tell me more\b/,
  /^continue\b/,
  /^and then\b/,
  /^what about\b/,
  /^why\??$/,
  /^how so\??$/,
  /^cerita lagi\b/,
  /^teruskan\b/,
  /^bagaimana pula\b/,
  /^再说/,
  /^继续/,
  /^那/,
];

function isFollowUpQuery(question) {
  const query = normalizeText(question);
  if (!query) return false;
  if (FOLLOW_UP_PHRASES.some(pattern => pattern.test(query))) return true;

  const shortQuery = query.length <= 90;
  const hasReferencePronoun = /\b(it|this|that|they|them|those|there|he|she)\b/.test(query)
    || /\b(ini|itu|dia|mereka)\b/.test(query)
    || /[它这這那他她]/.test(query);

  return shortQuery && hasReferencePronoun;
}

module.exports = {
  isFollowUpQuery,
};
