import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { apiFetch, fieldErrors, isAuthenticated, saveSession } from '../api/client';
import Banner, { FieldError } from '../components/Banner.jsx';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (isAuthenticated()) {
    return <Navigate to="/books" replace />;
  }

  const serverErrors = fieldErrors(error);

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const session = await apiFetch('/auth/login', {
        method: 'POST',
        body: { username, password },
      });
      saveSession(session);
      navigate('/books', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-card__title">Manager Library</h1>
        <p className="login-card__subtitle">Inicia sesión para continuar</p>

        <Banner message={error ? error.message : null} />

        <form className="stack" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              name="username"
              type="text"
              autoComplete="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={serverErrors.username ? 'invalid' : ''}
              required
            />
            <FieldError message={serverErrors.username} />
          </div>

          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={serverErrors.password ? 'invalid' : ''}
              required
            />
            <FieldError message={serverErrors.password} />
          </div>

          <button type="submit" className="btn btn--primary btn--block" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
