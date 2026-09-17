export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
    public fieldErrors?: Record<string, string>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      credentials: 'include',
      signal: AbortSignal.timeout(15000),
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers },
    });
  } catch (error) {
    throw new ApiError('NETWORK_ERROR', error instanceof DOMException && error.name === 'TimeoutError'
      ? 'La respuesta está tardando demasiado. Vuelve a intentarlo.'
      : 'No hay conexión con el servidor. Revisa tu conexión e inténtalo nuevamente.', 0);
  }
  if (response.status === 204) return null as T;
  const body = await response.json().catch(() => null);
  if (response.status === 401 && !path.startsWith('/auth/')) window.dispatchEvent(new Event('praxia:session-expired'));
  if (!response.ok)
    throw new ApiError(
      body?.code || 'REQUEST_FAILED',
      body?.message || 'No pudimos completar la solicitud. Vuelve a intentarlo.',
      response.status,
      body?.fieldErrors,
    );
  if (!body || !('data' in body)) throw new ApiError('INVALID_RESPONSE', 'El servidor respondió con un formato inesperado.', 502);
  return body.data;
}
export const json = (method: string, data?: unknown): RequestInit => ({
  method,
  ...(data === undefined ? {} : { body: JSON.stringify(data) }),
});
