import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'tasks_reminders_api_token';

@Injectable({ providedIn: 'root' })
export class TokenStore {
  readonly token = signal<string | null>(null);

  constructor() {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      this.token.set(stored);
    }
  }

  get(): string | null {
    return this.token();
  }

  setToken(accessToken: string): void {
    localStorage.setItem(STORAGE_KEY, accessToken);
    this.token.set(accessToken);
  }

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.token.set(null);
  }
}
