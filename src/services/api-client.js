export class ApiError extends Error {
  constructor(message, { code = 'API_ERROR', status = 0, requestId = null, data = {} } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.requestId = requestId;
    this.data = data;
  }
}

function getHeader(response, name) {
  return response?.headers?.get?.(name) || null;
}

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
