const SAFE_FALLBACK = Object.freeze({
    answer: 'I do not have verified trail information for that question yet.',
    sourceSiteIds: [],
    confidence: 'low',
    notFound: true,
});

function parseModelResponse(text) {
    const parsed = JSON.parse(String(text || '').trim());
    return {
        answer: String(parsed.answer || ''),
        sourceSiteIds: Array.isArray(parsed.sourceSiteIds) ? parsed.sourceSiteIds.map(String) : [],
        confidence: ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'low',
        notFound: parsed.notFound === true,
    };
}

function validateResponse(contract, allowedSites) {
    if (contract.notFound) return { ...SAFE_FALLBACK };

    const allowedIds = new Set(allowedSites.map(site => site.id));
    const ids = contract.sourceSiteIds;
    if (!contract.answer || !ids.length || new Set(ids).size !== ids.length) return { ...SAFE_FALLBACK };
    if (ids.some(id => !allowedIds.has(id))) return { ...SAFE_FALLBACK };

    return contract;
}

module.exports = {
    parseModelResponse,
    SAFE_FALLBACK,
    validateResponse,
};
