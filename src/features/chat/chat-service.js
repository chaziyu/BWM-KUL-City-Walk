export function createChatService({ deviceId, fetchImpl = fetch }) {
  return {
    async send({ userQuery, history }) {
      const response = await fetchImpl('/api/chat', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Jejak-Device': deviceId,
        },
        body: JSON.stringify({ userQuery, history }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.reply || data.error || 'AI server error');
      return data.reply;
    },
  };
}
