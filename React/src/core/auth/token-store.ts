const STORAGE_KEY = 'tasks_reminders_api_token';

function readInitial(): string | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }
  return localStorage.getItem(STORAGE_KEY);
}

let token: string | null = readInitial();

export const tokenStore = {
  get(): string | null {
    return token;
  },
  setToken(accessToken: string): void {
    localStorage.setItem(STORAGE_KEY, accessToken);
    token = accessToken;
  },
  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
    token = null;
  },
};
