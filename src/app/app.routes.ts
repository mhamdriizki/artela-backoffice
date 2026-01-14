import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthService } from './core/services/auth-service';

const authGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return auth.isAuthenticated() ? true : router.createUrlTree(['/login']);
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: '',
    canActivate: [authGuard], // Lindungi semua route di bawah ini
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/invitation-form/invitation-form').then(m => m.InvitationForm)
      },
      {
        path: 'edit/:slug',
        loadComponent: () => import('./features/invitation-form/invitation-form').then(m => m.InvitationForm)
      }
    ]
  }
];
