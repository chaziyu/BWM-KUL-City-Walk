const { normalizeText } = require('./retrieve-sites');

function verifiedValue(value) {
  const text = String(value || '').trim();
  return text && text.toLowerCase() !== 'n/a' ? text : '';
}

function getDeterministicAnswer(question, sites) {
  if (!Array.isArray(sites) || !sites.length) return null;

  const site = sites[0];
  const query = normalizeText(question);
  if (sites.length > 1 && /\b(it|this|that|these|they)\b/.test(query)) return null;

  const asksWhenBuilt =
    /\bwhen\b.*\b(built|constructed|completed|opened|founded|rebuilt)\b/.test(query)
    || /\bwhat year\b.*\b(built|constructed|completed|opened|founded|rebuilt)\b/.test(query);

  if (asksWhenBuilt) {
    const built = verifiedValue(site.built);
    if (!built) return null;

    return {
      answer: `**${site.name}**: ${built}.`,
      sourceSiteIds: [site.id],
      confidence: 'high',
      notFound: false,
    };
  }

  const asksVisitTime =
    /\bhow long\b.*\b(visit|spend|explore)\b/.test(query)
    || /\bminutes?\b.*\b(visit|spend|explore)\b/.test(query);

  if (asksVisitTime && Number.isFinite(Number(site.estimatedVisitMinutes))) {
    return {
      answer: `Allow about **${Number(site.estimatedVisitMinutes)} minutes** for ${site.name}.`,
      sourceSiteIds: [site.id],
      confidence: 'high',
      notFound: false,
    };
  }

  return null;
}

module.exports = {
  getDeterministicAnswer,
};
