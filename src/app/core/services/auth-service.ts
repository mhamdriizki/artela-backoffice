import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.BASE_API;

  isAuthenticated = signal<boolean>(!!localStorage.getItem('token'));

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
  }

  login(credentials: any) {
    return this.http.post<{token: string}>(`${this.apiUrl}/api/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('token', res.token);
        this.isAuthenticated.set(true);
        this.router.navigate(['/dashboard']);
      })
    );
  }

  logout() {
    // Panggil API Logout Backend (Good Practice)
    this.http.post(`${this.apiUrl}/api/logout`, {}, this.getHeaders()).subscribe({
      next: () => this.doLogout(),
      error: () => this.doLogout() // Force logout di FE meskipun BE error/down
    });
  }

  private doLogout() {
    localStorage.removeItem('token');
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken() { return localStorage.getItem('token'); }
}
