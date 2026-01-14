
import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = environment.BASE_API;

  isAuthenticated = signal<boolean>(!!localStorage.getItem('token'));

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
    localStorage.removeItem('token');
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken() { return localStorage.getItem('token'); }
}
