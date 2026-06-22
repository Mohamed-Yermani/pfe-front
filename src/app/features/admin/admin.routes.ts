
import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
    path: 'user/:id',
    loadComponent: () => import('./pages/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  }
];
