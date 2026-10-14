import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Banner from '../components/Banner.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatDate, memberNameOf, statusLabel } from '../utils/format.js';

export default function LoanDetail() {
  const { id } = useParams();
  const { push } = useToast();
  const [loan, setLoan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returningId, setReturningId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch(`/loans/${id}`);
      setLoan(payload);
    } catch (err) {
      setLoan(null);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleReturn(item) {
    setReturningId(item.id);
    setError(null);
    try {
      await apiFetch(`/loans/${id}/items/${item.id}/return`, { method: 'POST' });
      push('Línea devuelta.', 'success');
      await load();
    } catch (err) {
      setError(err);
      push(err.message, 'error');
      if (err.status === 409) await load();
    } finally {
      setReturningId(null);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="loading">Cargando…</p>
      </div>
    );
  }

  if (error && !loan) {
    return (
      <div className="page">
        <div className="page-head">
          <h1>Préstamo</h1>
          <Link className="btn" to="/loans">
            Volver
          </Link>
        </div>
        <Banner message={error.message} />
      </div>
    );
  }

  const items = Array.isArray(loan.items) ? loan.items : [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Préstamo {shortId(loan.id)}</h1>
          <p className="muted">
            {memberNameOf(loan)} · {formatDate(loan.loaned_at)}
          </p>
        </div>
        <Link className="btn" to="/loans">
          Volver al listado
        </Link>
      </div>

      <Banner message={error ? error.message : null} />

      <div className="panel">
        <div className="panel__head">
          <h2>Datos del préstamo</h2>
          <span className={`badge badge--${loan.status || 'open'}`}>
            {statusLabel(loan.status)}
          </span>
        </div>
        <dl className="dl">
          <div>
            <dt>Identificador</dt>
            <dd className="cell-mono">{loan.id}</dd>
          </div>
          <div>
            <dt>Socio</dt>
            <dd>{memberNameOf(loan)}</dd>
          </div>
          <div>
            <dt>Prestado el</dt>
            <dd>{formatDate(loan.loaned_at)}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{statusLabel(loan.status)}</dd>
          </div>
        </dl>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Líneas</h2>
          <span className="count">{items.length}</span>
        </div>

        {items.length === 0 ? (
          <p className="empty">Sin resultados</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>ISBN</th>
                  <th>Categoría</th>
                  <th>Vence</th>
                  <th>Devuelto el</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="cell-strong">{item.book_title}</td>
                    <td className="cell-mono">{item.isbn}</td>
                    <td>{item.category_name}</td>
                    <td>{formatDate(item.due_at)}</td>
                    <td>
                      {item.returned_at ? (
                        formatDate(item.returned_at)
                      ) : (
                        <span className="badge badge--open">Sin devolver</span>
                      )}
                    </td>
                    <td>
                      {item.returned_at ? (
                        <span className="muted">—</span>
                      ) : (
                        <button
                          type="button"
                          className="btn btn--sm btn--primary"
                          disabled={returningId === item.id}
                          onClick={() => handleReturn(item)}
                        >
                          {returningId === item.id ? 'Devolviendo…' : 'Devolver'}
                        </button>
                      )}
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

function shortId(value) {
  if (!value) return '—';
  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 8)}…` : text;
}
