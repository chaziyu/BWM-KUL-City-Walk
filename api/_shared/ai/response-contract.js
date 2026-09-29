const SAFE_FALLBACK = Object.freeze({
    answer: 'I couldn’t find that in the verified BWM KUL City Walk notes yet. Ask me about a stop, route, or story along the walk.',
    sourceSiteIds: [],
    confidence: 'low',
    notFound: true,
});

function extractJsonText(text) {
    const raw = String(text || '').trim();
    if (!raw) throw new SyntaxError('AI response was empty.');

    const fenced = raw.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
    const candidate = (fenced?.[1] || raw).trim();

    try {
        JSON.parse(candidate);
        return candidate;
    } catch (initialError) {
        const start = candidate.indexOf('{');
        const end = candidate.lastIndexOf('}');
        if (start !== -1 && end > start) {
            const extracted = candidate.slice(start, end + 1);
            JSON.parse(extracted);
            return extracted;
        }
        throw initialError;
    }
}

function parseModelResponse(text) {
    const parsed = JSON.parse(extractJsonText(text));
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
    extractJsonText,
    parseModelResponse,
    SAFE_FALLBACK,
    validateResponse,
};
