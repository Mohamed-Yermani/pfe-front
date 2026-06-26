
import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/user-management/user-management.component').then(m => m.UserManagementComponent)
  },
  {
  path: 'admin/user/:id',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./pages/user-detail/user-detail.component')
      .then(m => m.UserDetailComponent)
},
  {
    path: 'user/:id',
    loadComponent: () => import('./pages/user-detail/user-detail.component').then(m => m.UserDetailComponent)
  }
];
