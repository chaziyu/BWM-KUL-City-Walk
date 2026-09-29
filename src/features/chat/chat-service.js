// @ts-check

import { ApiError, parseApiResponse } from '../../services/api-client.js';

/** @typedef {import('../../types/domain.js').ChatContext} ChatContext */
/** @typedef {import('../../types/domain.js').ChatResponse} ChatResponse */

/**
 * @param {{ deviceId: string, fetchImpl?: typeof fetch }} dependencies
 */
export function createChatService({ deviceId, fetchImpl = fetch }) {
  return {
    /**
     * @param {{ userQuery: string, context: ChatContext, history: unknown[] }} params
     * @returns {Promise<ChatResponse>}
     */
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
        if (!(error instanceof ApiError)) throw error;

        const remainingQuota = error.data?.remainingQuota;
        const hasRemainingQuota = remainingQuota !== null
          && remainingQuota !== undefined
          && Number.isFinite(Number(remainingQuota));
        if (hasRemainingQuota) {
          /** @type {ApiError & { remainingQuota?: number }} */ (error).remainingQuota =
            Number(remainingQuota);
        }
        throw error;
      }
    },
  };
}
