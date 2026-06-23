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

function buildSite(site) {
    const aiContext = cleanText(site.ai_context || site.info);
    const searchTerms = Object.freeze((Array.isArray(site.search_terms) ? site.search_terms : [])
        .map(term => cleanText(term, 200))
        .filter(Boolean));
    const faq = cleanText(Object.values(site.faq || {}).join(' '));
    const info = cleanText(site.info);
    const infoMore = cleanText(site.info_more || site.flyer_text);
    const searchableText = [
        site.name,
        searchTerms.join(' '),
        site.category,
        site.built,
        site.architects,
        info,
        infoMore,
        faq,
        aiContext,
    ].map(value => cleanText(Array.isArray(value) ? value.join(' ') : value)).filter(Boolean).join('\n');

    return Object.freeze({
        id: cleanText(site.id, 80),
        name: cleanText(site.name, 200),
        category: cleanText(site.category, 80),
        searchTerms,
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
