import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
  },
  {
    path: 'details/:listId',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/details/details.page').then((m) => m.DetailsPage),
  },
  {
    path: 'share-my-notes',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/share-my-notes/share-my-notes.page').then((m) => m.ShareMyNotesPage),
  },
  {
    path: 'share-my-notes/:listId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/share-my-notes/share-my-notes.page').then((m) => m.ShareMyNotesPage),
  },
  {
    path: 'shared-with-me',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/shared-with-me/shared-with-me.page').then((m) => m.SharedWithMePage),
  },
  { path: '**', redirectTo: 'home' },
];
