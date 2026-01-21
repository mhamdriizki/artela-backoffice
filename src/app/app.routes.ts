import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard'; // Import Guard

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: '',
    canActivate: [authGuard], // PROTEKSI UTAMA DISINI
    children: [
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
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'login'
  }
];
