import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export function Layout() {
  const { user, logout } = useAuth();
  const initial = user?.name?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <div className="shell">
      <header className="topbar">
        <NavLink to="/" className="brand">
          <span className="brand-mark" aria-hidden />
          <span className="brand-text">
            TaskFlow
            <span className="brand-tagline">Team tasks</span>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Main">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => (isActive ? "active" : "")}>
            Projects
          </NavLink>
        </nav>
        <div className="user-area">
          <div className="user-chip" title={user?.email}>
            <span className="user-avatar" aria-hidden>
              {initial}
            </span>
            <div className="user-meta">
              <span className="user-name">{user?.name}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button type="button" className="btn ghost sm" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
