import { parseApiResponse } from '../../services/api-client.js';

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
      try {
        return await parseApiResponse(response, 'AI server error');
      } catch (error) {
        const remainingQuota = error?.data?.remainingQuota;
        const hasRemainingQuota = remainingQuota !== null
          && remainingQuota !== undefined
          && Number.isFinite(Number(remainingQuota));
        if (hasRemainingQuota) error.remainingQuota = Number(remainingQuota);
        throw error;
      }
    },
  };
}
