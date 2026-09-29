const PRIMARY_CHAT_MODEL = 'gemini-3.5-flash-lite';

const CHAT_MODELS = Object.freeze([
  PRIMARY_CHAT_MODEL,
  'gemini-3.1-flash-lite',
]);

const RETRIABLE_PROVIDER_STATUSES = new Set([404, 408, 429, 500, 502, 503, 504]);

function supportsJsonMode(modelName) {
  return String(modelName || '').startsWith('gemini-');
}

function shouldTryFallback(error) {
  const status = Number(error?.status);
  if (RETRIABLE_PROVIDER_STATUSES.has(status)) return true;

  const code = String(error?.code || '').toUpperCase();
  if (['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(code)) return true;

  return error?.name === 'AbortError'
    || /timeout|timed out|temporar/i.test(String(error?.message || ''));
}

module.exports = {
  CHAT_MODELS,
  PRIMARY_CHAT_MODEL,
  shouldTryFallback,
  supportsJsonMode,
};
