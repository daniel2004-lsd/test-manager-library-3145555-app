import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch, fieldErrors } from '../api/client';
import Banner, { FieldError } from '../components/Banner.jsx';
import Pagination from '../components/Pagination.jsx';
import { useToast } from '../components/Toast.jsx';

const PAGE_SIZE = 10;

export default function Members() {
  const { push } = useToast();
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ full_name: '', document_number: '' });
  const [clientErrors, setClientErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const payload = await apiFetch('/members', {
        query: { q: appliedQ, page, size: PAGE_SIZE },
      });
      setData(payload);
    } catch (err) {
      setData(null);
      setListError(err);
    } finally {
      setLoading(false);
    }
  }, [appliedQ, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setAppliedQ(q.trim());
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = {};
    if (!form.full_name.trim()) errors.full_name = 'El nombre completo es obligatorio.';
    if (!form.document_number.trim()) errors.document_number = 'El documento es obligatorio.';
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      await apiFetch('/members', {
        method: 'POST',
        body: {
          full_name: form.full_name.trim(),
          document_number: form.document_number.trim(),
        },
      });
      push('Socio creado.', 'success');
      setForm({ full_name: '', document_number: '' });
      setClientErrors({});
      setFormOpen(false);
      await load();
    } catch (err) {
      setFormError(err);
      if (err.status === 409) await load();
    } finally {
      setSaving(false);
    }
  }

  const serverErrors = fieldErrors(formError);
  const errorFor = (field) => clientErrors[field] || serverErrors[field];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Socios</h1>
          <p className="muted">Altas y consulta de socios de la biblioteca.</p>
        </div>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setFormOpen((open) => !open);
            setFormError(null);
            setClientErrors({});
          }}
        >
          {formOpen ? 'Ocultar formulario' : 'Nuevo socio'}
        </button>
      </div>

      {formOpen && (
        <section className="panel">
          <div className="panel__head">
            <h2>Nuevo socio</h2>
          </div>

          <Banner message={formError ? formError.message : null} />

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="member-name">Nombre completo</label>
              <input
                id="member-name"
                type="text"
                value={form.full_name}
                onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                className={errorFor('full_name') ? 'invalid' : ''}
                required
              />
              <FieldError message={errorFor('full_name')} />
            </div>

            <div className="field">
              <label htmlFor="member-doc">Documento</label>
              <input
                id="member-doc"
                type="text"
                value={form.document_number}
                onChange={(event) => setForm({ ...form, document_number: event.target.value })}
                className={errorFor('document_number') ? 'invalid' : ''}
                required
              />
              <FieldError message={errorFor('document_number')} />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Guardando…' : 'Crear socio'}
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="panel">
        <form className="filters" onSubmit={applySearch}>
          <div className="field field--grow">
            <label htmlFor="members-q">Buscar</label>
            <input
              id="members-q"
              type="search"
              placeholder="Nombre o documento"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <div className="filters__actions">
            <button type="submit" className="btn btn--primary">
              Buscar
            </button>
            <button
              type="button"
              className="btn"
              onClick={() => {
                setQ('');
                setAppliedQ('');
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
        ) : !data || !data.items || data.items.length === 0 ? (
          <p className="empty">Sin resultados</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Préstamos activos</th>
                    <th>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((member) => (
                    <tr key={member.id}>
                      <td className="cell-strong">{member.full_name}</td>
                      <td className="cell-mono">{member.document_number}</td>
                      <td>{activeLoanCount(member.active_loans)}</td>
                      <td>
                        <Link className="btn btn--sm" to={`/members/${member.id}`}>
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

function activeLoanCount(value) {
  if (Array.isArray(value)) return value.length;
  if (typeof value === 'number') return value;
  return 0;
}
