import { useState } from 'react';
import { apiFetch, isAdmin } from '../api/client';
import Banner from '../components/Banner.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Reports() {
  const { push } = useToast();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [fieldError, setFieldError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isAdmin()) {
    return (
      <div className="page">
        <div className="page-head">
          <h1>Reportes</h1>
        </div>
        <Banner message="Solo administradores" />
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setFieldError(null);

    if (!from || !to) {
      setFieldError('Selecciona las dos fechas del rango.');
      setData(null);
      return;
    }
    if (from > to) {
      setFieldError('El rango de fechas es inválido: el fin debe ser igual o posterior al inicio.');
      setData(null);
      return;
    }

    setLoading(true);
    try {
      const payload = await apiFetch('/reports/most-borrowed', {
        query: { from, to },
      });
      setData(payload);
      if (payload && Array.isArray(payload.rows) && payload.rows.length === 0) {
        push('El rango consultado no tiene préstamos.', 'success');
      }
    } catch (err) {
      setData(null);
      setError(err);
      if (err.status === 403) push('Solo administradores', 'error');
    } finally {
      setLoading(false);
    }
  }

  const rows =
    data && Array.isArray(data.rows)
      ? [...data.rows].sort((a, b) => {
          const diff = Number(b.times_borrowed || 0) - Number(a.times_borrowed || 0);
          if (diff !== 0) return diff;
          return String(a.book_title || '').localeCompare(String(b.book_title || ''));
        })
      : [];

  const bannerMessage =
    error && error.status === 403 ? 'Solo administradores' : error ? error.message : fieldError;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Reporte de libros más prestados</h1>
          <p className="muted">Rango de fechas obligatorio, ambos días incluidos.</p>
        </div>
      </div>

      <div className="panel">
        <form className="filters" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="report-from">Desde</label>
            <input
              id="report-from"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="report-to">Hasta</label>
            <input
              id="report-to"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              required
            />
          </div>
          <div className="filters__actions">
            <button type="submit" className="btn btn--primary" disabled={loading}>
              {loading ? 'Generando…' : 'Generar reporte'}
            </button>
          </div>
        </form>

        <Banner message={bannerMessage} />
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Resultados</h2>
          {data && (
            <span className="muted">
              {data.from} · {data.to} · {rows.length} títulos
            </span>
          )}
        </div>

        {!data ? (
          <p className="empty">Selecciona un rango de fechas para ver el reporte.</p>
        ) : rows.length === 0 ? (
          <p className="empty">Sin resultados</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Libro</th>
                  <th>Categoría</th>
                  <th>Veces prestado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={row.book_id || `${row.book_title}-${index}`}>
                    <td className="cell-mono">{index + 1}</td>
                    <td className="cell-strong">{row.book_title}</td>
                    <td>{row.category_name}</td>
                    <td>{row.times_borrowed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
