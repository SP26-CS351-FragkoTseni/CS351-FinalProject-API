import { environment } from '../../environment';
import { tokenStore } from '../auth/token-store';

export class ApiHttpError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiHttpError';
    this.status = status;
    this.body = body;
  }
}

/**
 * JSON request helper with Bearer auth (skipped for POST /auth/login), matching the Angular interceptor.
 */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${environment.apiBaseUrl}${path}`;
  const method = (init?.method ?? 'GET').toUpperCase();
  const isLogin = path.includes('/auth/login') && method === 'POST';

  const headers = new Headers(init?.headers);
  if (init?.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const t = tokenStore.get();
  if (t && !isLogin) {
    headers.set('Authorization', `Bearer ${t}`);
  }

  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => undefined);
    throw new ApiHttpError('Request failed', res.status, body);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export function buildQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  }
  const q = search.toString();
  return q ? `?${q}` : '';
}
