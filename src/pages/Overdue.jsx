import { useCallback, useEffect, useState } from 'react';
import { apiFetch } from '../api/client';
import Banner from '../components/Banner.jsx';
import { listOf, formatDate } from '../utils/format.js';

export default function Overdue() {
  const [items, setItems] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch('/loans/overdue');
      const rows = listOf(payload).slice();
      rows.sort((a, b) => Number(b.days_late || 0) - Number(a.days_late || 0));
      setItems(rows);
    } catch (err) {
      setItems(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Libros vencidos</h1>
          <p className="muted">Líneas sin devolver con vencimiento vencido, mayor retraso primero.</p>
        </div>
        <button type="button" className="btn" onClick={load}>
          Actualizar
        </button>
      </div>

      <div className="panel">
        <Banner message={error ? error.message : null} />

        {loading ? (
          <p className="loading">Cargando…</p>
        ) : !items || items.length === 0 ? (
          <p className="empty">Sin resultados</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Socio</th>
                  <th>Vencimiento</th>
                  <th>Días de retraso</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.item_id || `${row.loan_id}-${row.book_title}`}>
                    <td className="cell-strong">{row.book_title}</td>
                    <td>{row.member_name}</td>
                    <td>{formatDate(row.due_at)}</td>
                    <td>
                      <span className="badge badge--overdue">{row.days_late}</span>
                    </td>
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
