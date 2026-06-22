
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  await authService.isInitialized;

  const expectedRole = route.data['expectedRole'];
  const currentUser = authService.currentUser();

  if (authService.isAuthenticated() && currentUser) {
    if (Array.isArray(expectedRole)) {
      if (expectedRole.some(role => currentUser.roles.includes(role))) {
        return true;
      }
    } else if (currentUser.roles.includes(expectedRole)) {
      return true;
    }
  }
  
  router.navigate(['/dashboard']);
  return false;
};
