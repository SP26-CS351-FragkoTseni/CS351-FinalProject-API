import { Navigate, Outlet } from 'react-router-dom';
import { isAuthenticated } from '../core/auth/auth';

export function RequireAuth() {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
