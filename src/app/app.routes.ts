import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((m) => m.Home),
  },
  {
    path: 'polls/:id',
    loadComponent: () => import('./features/poll-detail/poll-detail').then((m) => m.PollDetail),
  },
];
