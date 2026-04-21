import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { isAuthenticated } from '../core/auth/auth';

export function GuestRoute({ children }: { children: ReactNode }) {
  if (isAuthenticated()) {
    return <Navigate to="/tasks" replace />;
  }
  return <>{children}</>;
}
