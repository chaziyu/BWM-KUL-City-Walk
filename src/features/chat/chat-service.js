export function createChatService({ deviceId, fetchImpl = fetch }) {
  return {
    async send({ userQuery, context, history }) {
      const response = await fetchImpl('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Jejak-Device': deviceId,
        },
        body: JSON.stringify({ userQuery, context, history }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const error = new Error(data.reply || data.error || 'AI server error');
        error.status = response.status;
        const hasRemainingQuota = data.remainingQuota !== null
          && data.remainingQuota !== undefined
          && Number.isFinite(Number(data.remainingQuota));
        if (hasRemainingQuota) error.remainingQuota = Number(data.remainingQuota);
        throw error;
      }
      return data;
    },
  };
}
