import { Routes } from '@angular/router';
import { MainLayoutComponent } from './shared/layouts/main-layout/main-layout.component';
import { AuthLayoutComponent } from './shared/layouts/auth-layout/auth-layout.component';
import { authGuard } from './core/guards/auth.guard';
import { unauthGuard } from './core/guards/unauth.guard';
import { homeRedirectGuard } from './core/guards/home-redirect.guard';


export const APP_ROUTES: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      { path: '', pathMatch: 'full', canActivate: [homeRedirectGuard], children: [] },
      {
        path: 'home',
        loadComponent: () => import('./features/home/pages/home/home.component').then(m => m.HomeComponent)
      },
      {
        path: 'dashboard',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'dossiers',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dossiers/pages/dossier-list').then(m => m.DossierListComponent)
      },
      {
        path: 'dossiers/nouveau',
        canActivate: [authGuard],
        loadComponent: () => import('./features/dossiers/pages/dossier-form').then(m => m.DossierFormComponent)
      },
      {
        path: 'dossiers/validation',
        canActivate: [authGuard],
        loadComponent: () => import('./features/agent/pages/dossier-validation').then(m => m.DossierValidationComponent)
      },
      {
        path: 'profile',
        canActivate: [authGuard],
        loadComponent: () => import('./features/profile/pages/profile-view/profile-view.component').then(m => m.ProfileViewComponent)
      },
      {
        path: 'agent/all-dossiers',
        canActivate: [authGuard],
        loadComponent: () => import('./features/agent/pages/all-dossiers').then(m => m.AllDossiersComponent)
      }
    ]
  },
  {
    path: '',
    component: AuthLayoutComponent,
    canActivate: [unauthGuard],
    children: [
      {
        path: 'portal',
        loadComponent: () => import('./features/auth/pages/portal/portal.component').then(m => m.PortalComponent)
      },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/pages/register/register.component').then(m => m.RegisterComponent)
      }
    ]
  },
  { path: '**', redirectTo: 'home' }
];