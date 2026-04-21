import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './features/shell/AppShell';
import { GuestRoute } from './routes/GuestRoute';
import { RequireAuth } from './routes/RequireAuth';
import { LoginPage } from './features/login/LoginPage';
import { ListsPage } from './features/lists/ListsPage';
import { ProfilePage } from './features/profile/ProfilePage';
import { TaskDetailPage } from './features/task-detail/TaskDetailPage';
import { TasksPage } from './features/tasks/TasksPage';

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <GuestRoute>
            <LoginPage />
          </GuestRoute>
        }
      />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/tasks" replace />} />
          <Route path="tasks" element={<TasksPage />} />
          <Route path="tasks/:id" element={<TaskDetailPage />} />
          <Route path="lists" element={<ListsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/tasks" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
