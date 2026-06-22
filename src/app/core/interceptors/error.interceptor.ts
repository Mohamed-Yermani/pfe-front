
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      const isExternal = req.url.startsWith('http://') || req.url.startsWith('https://');
      const isLocalApi = !isExternal || req.url.includes('/api/');

      if (error.status === 401 && isLocalApi) {
        authService.logout();
          req 
      }
      console.error('HTTP Error:', error);
      return throwError(() => error);
    })
  );
};
