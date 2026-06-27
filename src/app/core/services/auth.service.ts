
import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { AuthResponse, UserDto, RegisterRequest } from '../models/api.model';

interface DecodedToken {
  sub: string; // email
  roles: string[];
  iat: number;
  exp: number;
}
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  
  private readonly TOKEN_KEY = 'cnss_auth_token';
  private readonly USER_KEY = 'cnss_user';

  #token = signal<string | null>(this.getTokenFromStorage());
  #currentUser = signal<UserDto | null>(this.getUserFromStorage());

  isAuthenticated = computed(() => !!this.#token());
  currentUser = computed(() => this.#currentUser());
  isAdmin = computed(() => this.currentUser()?.roles.includes('ROLE_ADMIN') ?? false);

  constructor() {
    // Tenter de charger l'utilisateur complet au démarrage si seulement un token existe
    if (this.isAuthenticated() && !this.#currentUser()) {
        this.loadCurrentUser().subscribe();
    }
  }

  getToken(): string | null {
    return this.#token();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>('/api/auth/login', { email, password }).pipe(
      tap((response) => this.setAuthState(response))
    );
  }

  register(request: RegisterRequest): Observable<{ message: string }> {
    return this.http.post<{ message: string }>('/api/auth/register', request);
  }

  logout(): void {
    this.#token.set(null);
    this.#currentUser.set(null);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }

 loadCurrentUser(): Observable<UserDto> {
  return this.http.get<UserDto>('/api/auth/me').pipe(
      tap(user => this.setCurrentUser(user))
  );
}

// ✅ Permet aux autres composants de mettre à jour l'utilisateur courant
// (ex: après modification du profil) sans dupliquer la logique de localStorage
updateCurrentUserState(user: UserDto): void {
  this.setCurrentUser(user);
}

  private setAuthState(response: AuthResponse): void {
    this.#token.set(response.token);
    
    if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.TOKEN_KEY, response.token);
    }
    
    this.loadCurrentUser().subscribe();
  }

  private setCurrentUser(user: UserDto): void {
    this.#currentUser.set(user);
     if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }
  }

  private getTokenFromStorage(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      return localStorage.getItem(this.TOKEN_KEY);
    }
    return null;
  }

  private getUserFromStorage(): UserDto | null {
    if (isPlatformBrowser(this.platformId)) {
        const userJson = localStorage.getItem(this.USER_KEY);
        return userJson ? JSON.parse(userJson) : null;
    }
    return null;
  }
}
