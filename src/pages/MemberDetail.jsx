import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Banner from '../components/Banner.jsx';
import { useToast } from '../components/Toast.jsx';
import { formatDate, statusLabel } from '../utils/format.js';

export default function MemberDetail() {
  const { id } = useParams();
  const { push } = useToast();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = await apiFetch(`/members/${id}`);
      setMember(payload);
    } catch (err) {
      setMember(null);
      setError(err);
      if (err.status === 404) push(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [id, push]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="page">
        <p className="loading">Cargando…</p>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="page">
        <div className="page-head">
          <h1>Socio</h1>
          <Link className="btn" to="/members">
            Volver
          </Link>
        </div>
        <Banner message={error ? error.message : 'No se encontró el socio.'} />
      </div>
    );
  }

  const active = Array.isArray(member.active_loans) ? member.active_loans : [];
  const activeCount =
    typeof member.active_loans === 'number' ? member.active_loans : active.length;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>{member.full_name}</h1>
          <p className="muted">Documento: {member.document_number}</p>
        </div>
        <Link className="btn" to="/members">
          Volver al listado
        </Link>
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Préstamos activos</h2>
          <span className="count">{activeCount}</span>
        </div>

        {active.length === 0 ? (
          <p className="empty">Sin resultados</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Préstamo</th>
                  <th>Estado</th>
                  <th>Prestado el</th>
                  <th>Líneas</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {active.map((loan) => (
                  <tr key={loan.id || `${loan.loaned_at}-${loan.status}`}>
                    <td className="cell-mono">{shortId(loan.id)}</td>
                    <td>
                      <StatusBadge status={loan.status} />
                    </td>
                    <td>{formatDate(loan.loaned_at)}</td>
                    <td>{Array.isArray(loan.items) ? loan.items.length : '—'}</td>
                    <td>
                      {loan.id ? (
                        <Link className="btn btn--sm" to={`/loans/${loan.id}`}>
                          Ver
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="panel__head">
          <h2>Resumen</h2>
        </div>
        <dl className="dl">
          <div>
            <dt>Nombre</dt>
            <dd>{member.full_name}</dd>
          </div>
          <div>
            <dt>Documento</dt>
            <dd className="cell-mono">{member.document_number}</dd>
          </div>
          <div>
            <dt>Préstamos sin devolver</dt>
            <dd>{activeCount}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function shortId(value) {
  if (!value) return '—';
  const text = String(value);
  return text.length > 12 ? `${text.slice(0, 8)}…` : text;
}

function StatusBadge({ status }) {
  return <span className={`badge badge--${status || 'open'}`}>{statusLabel(status)}</span>;
}
