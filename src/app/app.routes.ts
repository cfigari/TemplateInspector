import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'templates',
    loadComponent: () => import('./pages/templates/templates.component').then(m => m.TemplatesComponent)
  },
  {
    path: 'validation',
    loadComponent: () => import('./pages/template-validator/template-validator.component').then(m => m.TemplateValidatorComponent)
  },
  {
    path: 'security',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
    // Aquí se cargaría el componente real de seguridad cuando se cree
  },
  {
    path: 'costs',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent)
    // Aquí se cargaría el componente real de costos cuando se cree
  },
  {
    path: 'settings',
    loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];