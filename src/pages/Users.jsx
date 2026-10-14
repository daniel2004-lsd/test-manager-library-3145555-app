import { useState } from 'react';
import { apiFetch, fieldErrors, isAdmin } from '../api/client';
import Banner, { FieldError } from '../components/Banner.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Users() {
  const { push } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [clientErrors, setClientErrors] = useState({});
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [saving, setSaving] = useState(false);

  if (!isAdmin()) {
    return (
      <div className="page">
        <div className="page-head">
          <h1>Usuarios</h1>
        </div>
        <Banner message="Solo administradores" />
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setCreated(null);

    const errors = {};
    if (!username.trim()) errors.username = 'El nombre de usuario es obligatorio.';
    if (!password) errors.password = 'La contraseña es obligatoria.';
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const payload = await apiFetch('/users', {
        method: 'POST',
        body: { username: username.trim(), password, role: 'librarian' },
      });
      setCreated(payload);
      push(`Bibliotecario creado: ${payload.username}`, 'success');
      setUsername('');
      setPassword('');
      setClientErrors({});
    } catch (err) {
      setError(err);
      if (err.status === 409) push(err.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const serverErrors = fieldErrors(error);
  const errorFor = (field) => clientErrors[field] || serverErrors[field];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Usuarios</h1>
          <p className="muted">Alta de bibliotecarios. El rol de administrador no se crea aquí.</p>
        </div>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Nuevo bibliotecario</h2>
        </div>

        <Banner message={error ? error.message : null} />
        {created && (
          <Banner
            type="success"
            message={`Usuario creado: ${created.username} (rol ${created.role}).`}
          />
        )}

        <form className="form-grid" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="user-username">Usuario</label>
            <input
              id="user-username"
              type="text"
              autoComplete="off"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className={errorFor('username') ? 'invalid' : ''}
              required
            />
            <FieldError message={errorFor('username')} />
            <span className="hint">Se guarda en minúsculas y recortado.</span>
          </div>

          <div className="field">
            <label htmlFor="user-password">Contraseña</label>
            <input
              id="user-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={errorFor('password') ? 'invalid' : ''}
              required
            />
            <FieldError message={errorFor('password')} />
          </div>

          <div className="field">
            <label htmlFor="user-role">Rol</label>
            <input id="user-role" type="text" value="librarian" readOnly disabled />
            <span className="hint">Solo se crean bibliotecarios.</span>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Creando…' : 'Crear bibliotecario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
