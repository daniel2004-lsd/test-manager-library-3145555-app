import { useEffect } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { ToastProvider, useToast } from './components/Toast.jsx';
import Shell from './components/Shell.jsx';
import Login from './pages/Login.jsx';
import Books from './pages/Books.jsx';
import Members from './pages/Members.jsx';
import MemberDetail from './pages/MemberDetail.jsx';
import Loans from './pages/Loans.jsx';
import LoanCreate from './pages/LoanCreate.jsx';
import LoanDetail from './pages/LoanDetail.jsx';
import Overdue from './pages/Overdue.jsx';
import Reports from './pages/Reports.jsx';
import Users from './pages/Users.jsx';
import { UNAUTHORIZED_EVENT } from './api/client';

function SessionWatcher() {
  const navigate = useNavigate();
  const { push } = useToast();

  useEffect(() => {
    function handleUnauthorized() {
      navigate('/login', { replace: true });
      push('Tu sesión expiró o no es válida. Inicia sesión de nuevo.', 'error');
    }
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [navigate, push]);

  return null;
}

function NotFound() {
  return (
    <div className="page">
      <div className="panel">
        <h1>Página no encontrada</h1>
        <p className="muted">La dirección solicitada no existe.</p>
        <p>
          <Link className="btn btn--primary" to="/books">
            Ir al catálogo
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <SessionWatcher />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Shell />}>
            <Route index element={<Navigate to="/books" replace />} />
            <Route path="/books" element={<Books />} />
            <Route path="/members" element={<Members />} />
            <Route path="/members/:id" element={<MemberDetail />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/loans/new" element={<LoanCreate />} />
            <Route path="/loans/:id" element={<LoanDetail />} />
            <Route path="/overdue" element={<Overdue />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}
