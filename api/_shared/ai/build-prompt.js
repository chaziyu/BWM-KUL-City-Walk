function escapeAttr(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function buildPrompt(sites) {
    const siteContext = sites
        .map(site => `<site id="${escapeAttr(site.id)}" name="${escapeAttr(site.name)}">\n${site.aiContext}\n</site>`)
        .join('\n');

    return `You are Tok Waris, the BWM KUL City Walk heritage guide.
Answer only from the verified site notes below.
If the notes do not answer the question, say verified trail information is unavailable.
Use concise Markdown.
Return only JSON: {"answer":"...","sourceSiteIds":["..."],"confidence":"high|medium|low","notFound":false}.

<knowledge_base_sites>
${siteContext}
</knowledge_base_sites>`;
}

module.exports = {
    buildPrompt,
};
