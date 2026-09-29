// @ts-check

export class ApiError extends Error {
  /**
   * @param {string} message
   * @param {{
   *   code?: string,
   *   status?: number,
   *   requestId?: string | null,
   *   data?: Record<string, any>
   * }} [options]
   */
  constructor(message, {
    code = 'API_ERROR',
    status = 0,
    requestId = null,
    data = {},
  } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.data = data;
  }
}

/**
 * @param {Response} response
 * @param {string} name
 * @returns {string | null}
 */
function getHeader(response, name) {
  return response?.headers?.get?.(name) || null;
}

/**
 * @param {Response} response
 * @param {string} [fallbackMessage]
 * @returns {Promise<any>}
 */
export async function parseApiResponse(response, fallbackMessage = 'Request failed.') {
  const data = await response.json().catch(() => ({}));
  if (response.ok) return data;

  throw new ApiError(
    data.error || data.reply || fallbackMessage,
    {
      code: data.code || 'API_ERROR',
      status: Number(response.status) || 0,
      requestId: getHeader(response, 'X-Request-Id'),
      data,
    },
  );
}
