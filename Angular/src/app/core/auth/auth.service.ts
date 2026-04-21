import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, finalize, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, LoginResponse } from '../models/api.types';
import { TokenStore } from './token.store';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokens = inject(TokenStore);

  isAuthenticated(): boolean {
    return !!this.tokens.get();
  }

  login(body: LoginRequest): Observable<void> {
    return this.http.post<LoginResponse>(`${environment.apiBaseUrl}/auth/login`, body).pipe(
      tap((res) => this.tokens.setToken(res.access_token)),
      map(() => undefined),
    );
  }

  logout(): Observable<void> {
    if (!this.tokens.get()) {
      return of(undefined);
    }
    return this.http.post<void>(`${environment.apiBaseUrl}/auth/logout`, {}).pipe(
      catchError(() => of(undefined)),
      finalize(() => this.tokens.clear()),
      map(() => undefined),
    );
  }
}
