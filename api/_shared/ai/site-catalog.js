const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

function cleanText(str, maxLength = 4000) {
  if (typeof str !== 'string') return '';
  return str.normalize('NFC')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, maxLength);
}

function cleanList(values, maxLength = 200) {
  return Object.freeze((Array.isArray(values) ? values : [])
    .map(value => cleanText(value, maxLength))
    .filter(Boolean));
}

function cleanFaq(faq = {}) {
  return Object.freeze({
    openingHours: cleanText(faq.opening_hours, 500),
    ticketFee: cleanText(faq.ticket_fee, 500),
    tips: cleanText(faq.tips, 1000),
  });
}

function buildSite(site) {
  const aiContext = cleanText(site.ai_context || site.info);
  const searchTerms = cleanList(site.search_terms);
  const aliases = cleanList(site.aliases);
  const faq = cleanFaq(site.faq);
  const info = cleanText(site.info);
  const infoMore = cleanText(site.info_more || site.flyer_text);
  const searchableText = [
    site.name,
    searchTerms.join(' '),
    aliases.join(' '),
    site.category,
    site.built,
    site.architects,
    site.estimatedVisitMinutes,
    info,
    infoMore,
    Object.values(faq).join(' '),
    aiContext,
  ].map(value => cleanText(Array.isArray(value) ? value.join(' ') : value)).filter(Boolean).join('\n');

  return Object.freeze({
    id: cleanText(site.id, 80),
    name: cleanText(site.name, 200),
    category: cleanText(site.category, 80),
    built: cleanText(site.built, 200),
    architects: cleanText(Array.isArray(site.architects) ? site.architects.join(', ') : site.architects, 300),
    estimatedVisitMinutes: Number.isFinite(Number(site.estimatedVisitMinutes)) ? Number(site.estimatedVisitMinutes) : null,
    searchTerms,
    aliases,
    faq,
    info,
    infoMore,
    aiContext,
    searchableText,
  });
}

const rawSites = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'sites.json'), 'utf8'));
const sites = Object.freeze(rawSites.filter(site => site?.id && site?.name).map(buildSite));
const siteById = Object.freeze(Object.fromEntries(sites.map(site => [site.id, site])));
const knowledgeVersion = crypto.createHash('sha256').update(JSON.stringify(sites)).digest('hex').slice(0, 12);

function getSiteById(siteId) {
  return siteById[cleanText(siteId, 80)] || null;
}

module.exports = {
  cleanText,
  getSiteById,
  knowledgeVersion,
  siteById,
  sites,
};
