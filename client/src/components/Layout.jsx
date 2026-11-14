import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useTheme } from '../context/ThemeContext.jsx';

const links = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Transactions' },
  { to: '/budget', label: 'Budget & Categories' },
  { to: '/reports', label: 'Reports' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <>
      <header className="navbar no-print">
        <div className="navbar-inner">
          <span className="brand">Finance Tracker</span>
          <button
            type="button"
            className="nav-toggle"
            aria-label="Toggle menu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            ☰
          </button>
          <nav className={open ? 'nav nav-open' : 'nav'}>
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} className="nav-link" onClick={() => setOpen(false)}>
                {l.label}
              </NavLink>
            ))}
            <div className="nav-actions">
              <button type="button" className="btn btn-small btn-ghost" onClick={toggle} aria-label="Toggle dark mode">
                {theme === 'dark' ? '☀ Light' : '☾ Dark'}
              </button>
              <span className="nav-user">{user?.name}</span>
              <button type="button" className="btn btn-small" onClick={logout}>
                Log out
              </button>
            </div>
          </nav>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </>
  );
}
