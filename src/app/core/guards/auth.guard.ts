import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  // Cek Token di LocalStorage
  const token = localStorage.getItem('token');

  if (token) {
    // Opsional: Anda bisa menambahkan logika cek expiry token disini (decode JWT)
    return true;
  } else {
    // Redirect ke Login jika tidak ada token
    router.navigate(['/login']);
    return false;
  }
};
