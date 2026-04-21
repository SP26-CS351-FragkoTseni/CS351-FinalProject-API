import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { guestGuard } from './core/auth/guest.guard';
import { AppShellComponent } from './features/shell/app-shell.component';
import { ListsPageComponent } from './features/lists/lists-page.component';
import { LoginComponent } from './features/login/login.component';
import { ProfilePageComponent } from './features/profile/profile-page.component';
import { TaskDetailPageComponent } from './features/task-detail/task-detail-page.component';
import { TasksPageComponent } from './features/tasks/tasks-page.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tasks' },
      { path: 'tasks', component: TasksPageComponent },
      { path: 'tasks/:id', component: TaskDetailPageComponent },
      { path: 'lists', component: ListsPageComponent },
      { path: 'profile', component: ProfilePageComponent },
    ],
  },
  { path: '**', redirectTo: '/tasks' },
];
