import { useCallback, useEffect, useState } from 'react';
import { apiFetch, fieldErrors, isAdmin } from '../api/client';
import Banner, { FieldError } from '../components/Banner.jsx';
import CoverImage from '../components/CoverImage.jsx';
import Pagination from '../components/Pagination.jsx';
import { useToast } from '../components/Toast.jsx';
import { listOf } from '../utils/format.js';

const PAGE_SIZE = 10;

const EMPTY_FORM = {
  title: '',
  author: '',
  isbn: '',
  category_id: '',
  total_copies: '1',
};

export default function Books() {
  const { push } = useToast();
  const admin = isAdmin();

  const [categories, setCategories] = useState([]);
  const [q, setQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [clientErrors, setClientErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    apiFetch('/categories')
      .then((payload) => {
        if (!cancelled) setCategories(listOf(payload));
      })
      .catch(() => {
        if (!cancelled) setCategories([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const payload = await apiFetch('/books', {
        query: {
          q: appliedQ,
          category_id: categoryId,
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
  }, [appliedQ, categoryId, page]);

  useEffect(() => {
    load();
  }, [load]);

  function applySearch(event) {
    event.preventDefault();
    setPage(1);
    setAppliedQ(q.trim());
  }

  function clearFilters() {
    setQ('');
    setAppliedQ('');
    setCategoryId('');
    setPage(1);
  }

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setClientErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function openEdit(book) {
    setEditing(book);
    setForm({
      title: book.title || '',
      author: book.author || '',
      isbn: book.isbn || '',
      category_id: (book.category && book.category.id) || book.category_id || '',
      total_copies: String(book.total_copies ?? 1),
    });
    setClientErrors({});
    setFormError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
    setClientErrors({});
    setFormError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const errors = {};
    if (!form.title.trim()) errors.title = 'El título es obligatorio.';
    if (!form.author.trim()) errors.author = 'El autor es obligatorio.';
    if (!editing && !/^\d{13}$/.test(form.isbn.trim())) {
      errors.isbn = 'El ISBN debe tener exactamente 13 dígitos.';
    }
    if (!form.category_id) errors.category_id = 'Selecciona una categoría.';
    const total = Number(form.total_copies);
    if (!Number.isInteger(total) || total < 1) {
      errors.total_copies = 'El total debe ser un número entero mayor o igual a 1.';
    }
    setClientErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    setFormError(null);
    try {
      const body = {
        title: form.title.trim(),
        author: form.author.trim(),
        category_id: form.category_id,
        total_copies: total,
      };
      if (editing) {
        await apiFetch(`/books/${editing.id}`, { method: 'PUT', body });
        push('Libro actualizado.', 'success');
      } else {
        await apiFetch('/books', {
          method: 'POST',
          body: { ...body, isbn: form.isbn.trim() },
        });
        push('Libro creado.', 'success');
      }
      closeForm();
      await load();
    } catch (err) {
      setFormError(err);
      if (err.status === 409) await load();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(book) {
    const confirmed = window.confirm(`¿Eliminar del catálogo el libro «${book.title}»?`);
    if (!confirmed) return;
    try {
      await apiFetch(`/books/${book.id}`, { method: 'DELETE' });
      push('Libro eliminado del catálogo.', 'success');
      await load();
    } catch (err) {
      push(err.message, 'error');
      if (err.status === 409) await load();
    }
  }

  const serverErrors = fieldErrors(formError);
  const errorFor = (field) => clientErrors[field] || serverErrors[field];

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Catálogo de libros</h1>
          <p className="muted">Busca, filtra y administra los títulos de la biblioteca.</p>
        </div>
        {admin && (
          <button type="button" className="btn btn--primary" onClick={openCreate}>
            Nuevo libro
          </button>
        )}
      </div>

      {formOpen && (
        <section className="panel">
          <div className="panel__head">
            <h2>{editing ? 'Editar libro' : 'Nuevo libro'}</h2>
            <button type="button" className="btn btn--ghost" onClick={closeForm}>
              Cancelar
            </button>
          </div>

          <Banner message={formError ? formError.message : null} />

          <form className="form-grid" onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="book-title">Título</label>
              <input
                id="book-title"
                type="text"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className={errorFor('title') ? 'invalid' : ''}
                required
              />
              <FieldError message={errorFor('title')} />
            </div>

            <div className="field">
              <label htmlFor="book-author">Autor</label>
              <input
                id="book-author"
                type="text"
                value={form.author}
                onChange={(event) => setForm({ ...form, author: event.target.value })}
                className={errorFor('author') ? 'invalid' : ''}
                required
              />
              <FieldError message={errorFor('author')} />
            </div>

            <div className="field">
              <label htmlFor="book-isbn">ISBN</label>
              <input
                id="book-isbn"
                type="text"
                inputMode="numeric"
                maxLength={13}
                value={form.isbn}
                onChange={(event) => setForm({ ...form, isbn: event.target.value })}
                className={errorFor('isbn') ? 'invalid' : ''}
                disabled={Boolean(editing)}
                readOnly={Boolean(editing)}
                placeholder="13 dígitos"
                required={!editing}
              />
              <FieldError message={errorFor('isbn')} />
              {editing && <span className="hint">El ISBN no se modifica después de crear el libro.</span>}
            </div>

            <div className="field">
              <label htmlFor="book-category">Categoría</label>
              <select
                id="book-category"
                value={form.category_id}
                onChange={(event) => setForm({ ...form, category_id: event.target.value })}
                className={errorFor('category_id') ? 'invalid' : ''}
                required
              >
                <option value="">Selecciona una categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <FieldError message={errorFor('category_id')} />
            </div>

            <div className="field">
              <label htmlFor="book-total">Total de ejemplares</label>
              <input
                id="book-total"
                type="number"
                min="1"
                step="1"
                value={form.total_copies}
                onChange={(event) => setForm({ ...form, total_copies: event.target.value })}
                className={errorFor('total_copies') ? 'invalid' : ''}
                required
              />
              <FieldError message={errorFor('total_copies')} />
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear libro'}
              </button>
              <button type="button" className="btn" onClick={closeForm}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <div className="panel">
        <form className="filters" onSubmit={applySearch}>
          <div className="field field--grow">
            <label htmlFor="books-q">Buscar</label>
            <input
              id="books-q"
              type="search"
              placeholder="Título o autor"
              value={q}
              onChange={(event) => setQ(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="books-category">Categoría</label>
            <select
              id="books-category"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setPage(1);
              }}
            >
              <option value="">Todas</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="filters__actions">
            <button type="submit" className="btn btn--primary">
              Buscar
            </button>
            <button type="button" className="btn" onClick={clearFilters}>
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
                    <th>Portada</th>
                    <th>Título</th>
                    <th>Autor</th>
                    <th>ISBN</th>
                    <th>Categoría</th>
                    <th>Ejemplares</th>
                    <th>Disponibles</th>
                    {admin && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((book) => (
                    <tr key={book.id}>
                      <td>
                        <CoverImage bookId={book.id} title={book.title} />
                      </td>
                      <td className="cell-strong">{book.title}</td>
                      <td>{book.author}</td>
                      <td className="cell-mono">{book.isbn}</td>
                      <td>{(book.category && book.category.name) || '—'}</td>
                      <td>{book.total_copies}</td>
                      <td>
                        <span
                          className={`count ${Number(book.available_copies) === 0 ? 'count--zero' : ''}`}
                        >
                          {book.available_copies}
                        </span>
                      </td>
                      {admin && (
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn--sm"
                              onClick={() => openEdit(book)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--danger"
                              onClick={() => handleDelete(book)}
                            >
                              Borrar
                            </button>
                          </div>
                        </td>
                      )}
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
