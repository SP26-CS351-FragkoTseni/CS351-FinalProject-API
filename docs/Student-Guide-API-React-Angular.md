# CS351 Tasks & Reminders API — Student Guide

**How to use the API · React · Angular**

This guide explains how to run the backend locally, authenticate with JWTs, call the REST API, and connect a frontend built with **React** or **Angular**.

---

## Part 1 — How to use the API

### 1.1 Prerequisites

- **Node.js 18+** installed (`node -v`).
- This repository cloned on your machine.

### 1.2 Install and run the server

From the project root (where `package.json` lives):

```bash
npm install
npm start
```

By default the server listens on **port 3000**. All API routes are under the **`/v1`** prefix.

| Setting | Purpose |
|--------|---------|
| `PORT` | HTTP port (default `3000`) |
| `JWT_SECRET` | Secret for signing tokens — **set this in production** |
| `JWT_EXPIRES_IN` | Token lifetime (default `7d`) |
| `SQLITE_PATH` | Full path to the SQLite file (default `data/app.db`) |

### 1.3 Base URL

When the app runs locally:

```text
http://localhost:3000/v1
```

Example login URL: `http://localhost:3000/v1/auth/login`.

### 1.4 Authentication

- **Registration is not implemented.** Seeded accounts exist after the first server start (empty database is seeded automatically).
- Default test accounts (password **`secret`** for both):
  - `student@example.com`
  - `other@example.com`

**Login** — `POST /v1/auth/login` with JSON body:

```json
{
  "email": "student@example.com",
  "password": "secret"
}
```

**Response:**

```json
{
  "access_token": "<JWT string>",
  "token_type": "Bearer"
}
```

**All other routes** require a header:

```http
Authorization: Bearer <access_token>
```

**Logout** — `POST /v1/auth/logout` (with the same header). The server invalidates that token; afterwards, use login again for a new token.

**Current user** — `GET /v1/auth/me`  
**Update profile** — `PATCH /v1/auth/me` (optional fields: `name`, `email`, `password`)

### 1.5 Main resources (summary)

| Area | Endpoints (all under `/v1`) |
|------|-----------------------------|
| Tasks | `GET/POST /tasks`, `GET/PATCH/DELETE /tasks/:id`, `PATCH /tasks/:id/complete` |
| Task filters | `GET /tasks?status=pending|completed&priority=low|medium|high&list_id=&due_before=&due_after=` |
| Reminders | `GET/POST /tasks/:taskId/reminders`, `PATCH/DELETE /tasks/:taskId/reminders/:id` |
| Lists | `GET/POST /lists`, `PATCH/DELETE /lists/:id`, `GET /lists/:id/tasks` |

**Create task** example:

```json
POST /v1/tasks
{
  "title": "Submit lab",
  "due_date": "2026-04-18T23:59:00.000Z",
  "priority": "high",
  "list_id": 3
}
```

Timestamps should be **ISO 8601** strings (UTC recommended).

### 1.6 HTTP status codes

| Code | Meaning |
|------|---------|
| 200 | Success with JSON body |
| 201 | Created — body is the new resource |
| 204 | Success, **no body** (e.g. `DELETE`, `logout`) — do not call `.json()` on the response in the browser |
| 400 | Bad request / validation |
| 401 | Missing or invalid token |
| 403 | Authenticated but not allowed for this resource |
| 404 | Not found |

### 1.7 Error response shape

Every error uses this JSON shape:

```json
{
  "error": {
    "code": 401,
    "message": "Token missing or invalid."
  }
}
```

Check `response.status` and parse JSON only when the response has a body (not for `204`).

### 1.8 Quick test with curl (optional)

Replace `TOKEN` after logging in:

```bash
curl -s -X POST http://localhost:3000/v1/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"student@example.com\",\"password\":\"secret\"}"

curl -s http://localhost:3000/v1/tasks -H "Authorization: Bearer TOKEN"
```

(On macOS/Linux, use `\` instead of `^` for line continuation, or a single line.)

### 1.9 CORS (if the browser blocks requests)

If your React or Angular app runs on another origin (e.g. `http://localhost:4200`), the API must send **CORS** headers. If you see browser errors about CORS, add an Express CORS middleware on the server or use a dev proxy (see framework sections below).

---

## Part 2 — How to use the API from React

### 2.1 Recommended layout

- Keep the base URL in one place, e.g. `src/config.js`:  
  `export const API_BASE = 'http://localhost:3000/v1';`
- After login, store `access_token` where your app needs it:
  - **Simple:** `sessionStorage` or `localStorage` (course demos only; production apps often use httpOnly cookies + backend coordination).
- Attach **`Authorization: Bearer …`** on every API call except login.

### 2.2 Using `fetch`

```javascript
const API_BASE = 'http://localhost:3000/v1';

export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || res.statusText);
  return data; // { access_token, token_type }
}

export async function getTasks(token) {
  const res = await fetch(`${API_BASE}/tasks`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.message || res.statusText);
  return data;
}
```

**Important:** for `DELETE` or `logout`, if `res.status === 204`, **do not** call `res.json()`.

### 2.3 Using Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/v1',
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

// Login (no Bearer header)
export const login = (email, password) =>
  api.post('/auth/login', { email, password }).then((r) => r.data);
```

After login, call `setAuthToken(data.access_token)` before other requests.

### 2.4 Toggle task completed

Use **`PATCH /tasks/:id/complete`** for checkboxes instead of sending the full task in a generic `PATCH`.

### 2.5 Dev proxy (optional)

In `vite.config.js` (Vite) or `package.json` scripts (Create React App), proxy `/v1` to `http://localhost:3000` so your frontend can call `/v1/...` on the same origin and avoid CORS during development.

---

## Part 3 — How to use the API from Angular

### 3.1 `HttpClient` and environment

In `src/environments/environment.ts` (or `environment.development.ts`):

```typescript
export const environment = {
  production: false,
  apiBase: 'http://localhost:3000/v1',
};
```

Import `HttpClientModule` (standalone: provide `provideHttpClient()`) in your app config.

### 3.2 Auth service (store token)

```typescript
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs/operators';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private token: string | null = sessionStorage.getItem('access_token');

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {
    return this.http
      .post<{ access_token: string; token_type: string }>(
        `${environment.apiBase}/auth/login`,
        { email, password }
      )
      .pipe(
        tap((res) => {
          this.token = res.access_token;
          sessionStorage.setItem('access_token', res.access_token);
        })
      );
  }

  getToken() {
    return this.token;
  }

  logout() {
    return this.http.post(`${environment.apiBase}/auth/logout`, {}).pipe(
      tap(() => {
        this.token = null;
        sessionStorage.removeItem('access_token');
      })
    );
  }
}
```

Adjust `logout` if your backend returns `204` with an empty body — Angular’s `HttpClient` usually handles that without expecting JSON.

### 3.3 HTTP interceptor (attach Bearer)

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn((req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  if (token && !req.url.endsWith('/auth/login')) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
});
```

Register the interceptor in `app.config.ts`:

```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth.interceptor';

export const appConfig = {
  providers: [provideHttpClient(withInterceptors([authInterceptor]))],
};
```

### 3.4 Task service example

```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private base = `${environment.apiBase}/tasks`;

  list(params?: { status?: string; list_id?: number; priority?: string }) {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.list_id != null)
      httpParams = httpParams.set('list_id', String(params.list_id));
    if (params?.priority) httpParams = httpParams.set('priority', params.priority);
    return this.http.get<any[]>(this.base, { params: httpParams });
  }

  toggleComplete(id: number) {
    return this.http.patch<any>(`${this.base}/${id}/complete`, {});
  }
}
```

### 3.5 Dev proxy (optional)

In `proxy.conf.json`:

```json
{
  "/v1": {
    "target": "http://localhost:3000",
    "secure": false
  }
}
```

Run `ng serve --proxy-config proxy.conf.json` and set `apiBase` to `/v1` so the browser talks to the Angular dev server, which forwards to Express.

---

## Checklist before you demo

1. API runs (`npm start`) and database file exists under `data/` (or your `SQLITE_PATH`).
2. You can log in and receive `access_token`.
3. Frontend sends **`Authorization: Bearer …`** on protected calls.
4. You handle **`204 No Content`** without calling `.json()` (React `fetch`) or you rely on Angular’s default handling.
5. You use **server-side query params** for task filters instead of downloading all tasks and filtering only in the UI.

---

*Document generated for CS351 — Tasks & Reminders API (Express + SQLite).*
