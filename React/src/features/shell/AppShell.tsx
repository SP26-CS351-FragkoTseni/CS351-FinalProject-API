import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { logout } from '../../core/auth/auth';
import './AppShell.css';

export function AppShell() {
  const navigate = useNavigate();

  function onLogout(): void {
    void logout().then(() => {
      void navigate('/login', { replace: true });
    });
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">Tasks &amp; Reminders</div>
        <nav>
          <NavLink to="/tasks" end className={({ isActive }) => (isActive ? 'active' : '')}>
            Tasks
          </NavLink>
          <NavLink to="/lists" className={({ isActive }) => (isActive ? 'active' : '')}>
            Lists
          </NavLink>
          <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
            Profile
          </NavLink>
        </nav>
        <button type="button" className="ghost" onClick={onLogout}>
          Log out
        </button>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
