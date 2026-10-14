import { Navigate, NavLink, Link, Outlet, useNavigate } from 'react-router-dom';
import { clearSession, getRole, isAuthenticated, isAdmin } from '../api/client';

export default function Shell() {
  const navigate = useNavigate();

  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  function handleLogout() {
    clearSession();
    navigate('/login', { replace: true });
  }

  const roleLabel = getRole() === 'admin' ? 'Administrador' : 'Bibliotecario';

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar__inner">
          <Link to="/books" className="brand">
            Manager Library
          </Link>
          <nav className="nav" aria-label="Principal">
            <NavLink to="/books">Catálogo</NavLink>
            <NavLink to="/members">Socios</NavLink>
            <NavLink to="/loans">Préstamos</NavLink>
            <NavLink to="/overdue">Vencidos</NavLink>
            {isAdmin() && <NavLink to="/reports">Reportes</NavLink>}
            {isAdmin() && <NavLink to="/users">Usuarios</NavLink>}
          </nav>
          <div className="session">
            <span className="session__role">{roleLabel}</span>
            <button type="button" className="btn btn--ghost" onClick={handleLogout}>
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <Outlet />
      </main>

      <footer className="footer">
        <span>Manager Library · Catálogo, socios y préstamos</span>
      </footer>
    </div>
  );
}
