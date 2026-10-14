import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Banner from '../components/Banner.jsx';
import Pagination from '../components/Pagination.jsx';
import { byDateDesc, formatDate, listOf, memberNameOf, statusLabel } from '../utils/format.js';

const PAGE_SIZE = 10;

const EMPTY_FILTERS = { from: '', to: '', status: '', member_id: '' };

export default function Loans() {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/members', { query: { page: 1, size: 50 } })
      .then((payload) => {
        if (!cancelled) setMembers(listOf(payload));
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const payload = await apiFetch('/loans', {
        query: {
          from: filters.from,
          to: filters.to,
          status: filters.status,
          member_id: filters.member_id,
          page,
          size: PAGE_SIZE,
        },
      });
      setData(payload);
    } catch (err) {
      setData(null);
      setListError(err);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    load();
  }, [load]);

  function updateFilter(key, value) {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  }

  const items = data && Array.isArray(data.items)
    ? [...data.items].sort(byDateDesc('loaned_at'))
    : [];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Préstamos</h1>
          <p className="muted">Listado de préstamos ordenado por fecha, más reciente primero.</p>
        </div>
        <Link className="btn btn--primary" to="/loans/new">
          Nuevo préstamo
        </Link>
      </div>

      <div className="panel">
        <form
          className="filters"
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
        >
          <div className="field">
            <label htmlFor="loans-from">Desde</label>
            <input
              id="loans-from"
              type="date"
              value={filters.from}
              onChange={(event) => updateFilter('from', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="loans-to">Hasta</label>
            <input
              id="loans-to"
              type="date"
              value={filters.to}
              onChange={(event) => updateFilter('to', event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="loans-status">Estado</label>
            <select
              id="loans-status"
              value={filters.status}
              onChange={(event) => updateFilter('status', event.target.value)}
            >
              <option value="">Todos</option>
              <option value="open">Abierto</option>
              <option value="overdue">Vencido</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="loans-member">Socio</label>
            <select
              id="loans-member"
              value={filters.member_id}
              onChange={(event) => updateFilter('member_id', event.target.value)}
            >
              <option value="">Todos</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="filters__actions">
            <button type="submit" className="btn btn--primary">
              Aplicar
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setPage(1);
              }}
            >
              Limpiar
            </button>
          </div>
        </form>

        <Banner message={listError ? listError.message : null} />

        {loading ? (
          <p className="loading">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="empty">Sin resultados</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Préstamo</th>
                    <th>Socio</th>
                    <th>Prestado el</th>
                    <th>Estado</th>
                    <th>Líneas</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((loan) => (
                    <tr key={loan.id}>
                      <td className="cell-mono">{shortId(loan.id)}</td>
                      <td className="cell-strong">{memberNameOf(loan)}</td>
                      <td>{formatDate(loan.loaned_at)}</td>
                      <td>
                        <span className={`badge badge--${loan.status || 'open'}`}>
                          {statusLabel(loan.status)}
                        </span>
                      </td>
                      <td>{Array.isArray(loan.items) ? loan.items.length : (loan.items_count ?? '—')}</td>
                      <td>
                        <Link className="btn btn--sm" to={`/loans/${loan.id}`}>
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={data.page || page}
              size={data.size || PAGE_SIZE}
              total={data.total || 0}
              onChange={(next) => setPage(next)}
            />
          </>
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
