import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Poll App',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'polls/:id',
    title: 'Poll App',
    loadComponent: () => import('./features/poll-detail/poll-detail').then((m) => m.PollDetail),
  },
  {
    path: 'imprint',
    title: 'Imprint | Poll App',
    loadComponent: () => import('./features/imprint/imprint').then((m) => m.Imprint),
  },
  {
    path: 'privacy',
    title: 'Privacy policy | Poll App',
    loadComponent: () => import('./features/privacy/privacy').then((m) => m.Privacy),
  },
];
