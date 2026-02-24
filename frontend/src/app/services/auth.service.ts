import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse, LoginDto, RegisterDto, User } from '../models/models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<AuthResponse | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('connectus_user');
    if (stored) {
      this.currentUserSubject.next(JSON.parse(stored));
    }
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, dto).pipe(
      tap((res) => {
        localStorage.setItem('connectus_user', JSON.stringify(res));
        localStorage.setItem('connectus_token', res.token);
        this.currentUserSubject.next(res);
      }),
    );
  }

  register(dto: RegisterDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, dto)
      .pipe(
        tap((res) => {
          localStorage.setItem('connectus_user', JSON.stringify(res));
          localStorage.setItem('connectus_token', res.token);
          this.currentUserSubject.next(res);
        }),
      );
  }

  logout(): void {
    localStorage.removeItem('connectus_user');
    localStorage.removeItem('connectus_token');
    this.currentUserSubject.next(null);
  }

  getToken(): string | null {
    return localStorage.getItem('connectus_token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return user?.role === 'Admin';
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  getUserId(): number {
    return this.currentUserSubject.value?.userId ?? 0;
  }
}
