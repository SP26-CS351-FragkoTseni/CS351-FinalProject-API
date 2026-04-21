import { environment } from '../../environment';
import type { LoginRequest, LoginResponse } from '../models/api.types';
import { tokenStore } from './token-store';

export function isAuthenticated(): boolean {
  return !!tokenStore.get();
}

export async function login(body: LoginRequest): Promise<void> {
  const res = await fetch(`${environment.apiBaseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => undefined);
    const err = new Error('Login failed') as Error & { status?: number; body?: unknown };
    err.status = res.status;
    err.body = errBody;
    throw err;
  }

  const data = (await res.json()) as LoginResponse;
  tokenStore.setToken(data.access_token);
}

export async function logout(): Promise<void> {
  const token = tokenStore.get();
  if (!token) {
    return;
  }
  try {
    await fetch(`${environment.apiBaseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
  } catch {
    // ignore network errors — still clear local session
  } finally {
    tokenStore.clear();
  }
}
