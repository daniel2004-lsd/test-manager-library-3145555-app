import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../api/client';
import Banner from '../components/Banner.jsx';
import { useToast } from '../components/Toast.jsx';
import { listOf } from '../utils/format.js';

const MAX_ITEMS = 3;

export default function LoanCreate() {
  const navigate = useNavigate();
  const { push } = useToast();

  const [members, setMembers] = useState([]);
  const [memberQuery, setMemberQuery] = useState('');
  const [memberQ, setMemberQ] = useState('');
  const [memberId, setMemberId] = useState('');

  const [bookQuery, setBookQuery] = useState('');
  const [bookQ, setBookQ] = useState('');
  const [bookResults, setBookResults] = useState([]);
  const [booksLoading, setBooksLoading] = useState(false);

  const [selected, setSelected] = useState([]);
  const [error, setError] = useState(null);
  const [clientError, setClientError] = useState(null);
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback(async (search) => {
    try {
      const payload = await apiFetch('/members', {
        query: { q: search || '', page: 1, size: 50 },
      });
      setMembers(listOf(payload));
    } catch (err) {
      setMembers([]);
      if (err.status !== 401) setError(err);
    }
  }, []);

  const loadBooks = useCallback(async (search) => {
    setBooksLoading(true);
    try {
      const payload = await apiFetch('/books', {
        query: { q: search || '', page: 1, size: 10 },
      });
      const items = listOf(payload);
      setBookResults(items);
      setSelected((current) =>
        current.map((chosen) => {
          const fresh = items.find((item) => item.id === chosen.id);
          return fresh ? { ...chosen, available_copies: fresh.available_copies } : chosen;
        }),
      );
    } catch (err) {
      setBookResults([]);
      if (err.status !== 401) setError(err);
    } finally {
      setBooksLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMembers('');
  }, [loadMembers]);

  useEffect(() => {
    loadBooks('');
  }, [loadBooks]);

  function searchMembers(event) {
    event.preventDefault();
    setMemberQ(memberQuery.trim());
    loadMembers(memberQuery.trim());
  }

  function searchBooks(event) {
    event.preventDefault();
    const next = bookQuery.trim();
    setBookQ(next);
    loadBooks(next);
  }

  function addBook(book) {
    setError(null);
    setClientError(null);
    if (selected.some((item) => item.id === book.id)) {
      setClientError('Ese libro ya está seleccionado en el préstamo.');
      return;
    }
    if (selected.length >= MAX_ITEMS) {
      setClientError(`Un préstamo puede llevar como máximo ${MAX_ITEMS} libros.`);
      return;
    }
    if (Number(book.available_copies) <= 0) {
      setClientError(`No quedan ejemplares disponibles de «${book.title}».`);
      return;
    }
    setSelected((current) => [...current, book]);
  }

  function removeBook(bookId) {
    setSelected((current) => current.filter((book) => book.id !== bookId));
    setClientError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setClientError(null);

    if (!memberId) {
      setClientError('Selecciona un socio.');
      return;
    }
    if (selected.length < 1 || selected.length > MAX_ITEMS) {
      setClientError(`Selecciona entre 1 y ${MAX_ITEMS} libros.`);
      return;
    }

    setSaving(true);
    try {
      const payload = await apiFetch('/loans', {
        method: 'POST',
        body: {
          member_id: memberId,
          items: selected.map((book) => ({ book_id: book.id })),
        },
      });
      push('Préstamo registrado.', 'success');
      if (payload && payload.id) navigate(`/loans/${payload.id}`, { replace: true });
      else navigate('/loans', { replace: true });
    } catch (err) {
      setError(err);
      if (err.status === 409 || err.status === 422) {
        loadBooks(bookQ);
        loadMembers(memberQ);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Nuevo préstamo</h1>
          <p className="muted">Un socio y de 1 a 3 libros sin repetir.</p>
        </div>
        <Link className="btn" to="/loans">
          Volver
        </Link>
      </div>

      <Banner message={error ? error.message : clientError} />

      <form className="stack" onSubmit={handleSubmit} noValidate>
        <section className="panel">
          <div className="panel__head">
            <h2>1. Socio</h2>
          </div>

          <div className="filters">
            <div className="field field--grow">
              <label htmlFor="member-search">Buscar socio</label>
              <input
                id="member-search"
                type="search"
                placeholder="Nombre o documento"
                value={memberQuery}
                onChange={(event) => setMemberQuery(event.target.value)}
              />
            </div>
            <div className="filters__actions">
              <button type="button" className="btn" onClick={searchMembers}>
                Buscar
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="loan-member">Socio</label>
            <select
              id="loan-member"
              value={memberId}
              onChange={(event) => setMemberId(event.target.value)}
            >
              <option value="">Selecciona un socio</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.full_name} · {member.document_number}
                </option>
              ))}
            </select>
            {members.length === 0 && (
              <span className="hint">No hay socios disponibles con esa búsqueda.</span>
            )}
          </div>
        </section>

        <section className="panel">
          <div className="panel__head">
            <h2>2. Libros</h2>
            <span className="count">
              {selected.length}/{MAX_ITEMS}
            </span>
          </div>

          <div className="filters">
            <div className="field field--grow">
              <label htmlFor="book-search">Buscar libro</label>
              <input
                id="book-search"
                type="search"
                placeholder="Título o autor"
                value={bookQuery}
                onChange={(event) => setBookQuery(event.target.value)}
              />
            </div>
            <div className="filters__actions">
              <button type="button" className="btn" onClick={searchBooks}>
                Buscar
              </button>
            </div>
          </div>

          {booksLoading ? (
            <p className="loading">Cargando…</p>
          ) : bookResults.length === 0 ? (
            <p className="empty">Sin resultados</p>
          ) : (
            <ul className="results">
              {bookResults.map((book) => {
                const isSelected = selected.some((item) => item.id === book.id);
                const available = Number(book.available_copies) > 0;
                return (
                  <li key={book.id} className="result-row">
                    <div className="result-row__info">
                      <span className="cell-strong">{book.title}</span>
                      <span className="muted">
                        {book.author} · Disponibles: {book.available_copies}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn--sm"
                      disabled={isSelected || !available || selected.length >= MAX_ITEMS}
                      onClick={() => addBook(book)}
                    >
                      {isSelected
                        ? 'Agregado'
                        : !available
                          ? 'Sin ejemplares'
                          : 'Agregar'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          <div className="panel__head panel__head--inner">
            <h3>Seleccionados</h3>
          </div>

          {selected.length === 0 ? (
            <p className="empty">Aún no has seleccionado libros.</p>
          ) : (
            <ul className="results">
              {selected.map((book) => (
                <li key={book.id} className="result-row result-row--selected">
                  <div className="result-row__info">
                    <span className="cell-strong">{book.title}</span>
                    <span className="muted">{book.author}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn--sm btn--danger"
                    onClick={() => removeBook(book.id)}
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Registrando…' : 'Registrar préstamo'}
          </button>
          <Link className="btn" to="/loans">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
