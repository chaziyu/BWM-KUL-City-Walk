const CHAT_MODELS = Object.freeze([
    'gemini-3.5-flash-lite',
    'gemma-4-26b-a4b-it',
    'gemma-4-31b-it',
]);

function supportsJsonMode(modelName) {
    return String(modelName || '').startsWith('gemini-');
}

module.exports = {
    CHAT_MODELS,
    supportsJsonMode,
};
