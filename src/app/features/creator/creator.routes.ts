
import { Routes } from '@angular/router';

export const CREATOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/content-creator/content-creator.component').then(c => c.ContentCreatorComponent)
  }
];
