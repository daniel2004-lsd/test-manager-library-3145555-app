export default function Pagination({ page, size, total, onChange }) {
  const safeSize = size || 10;
  const safeTotal = total || 0;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safeSize));
  const current = page || 1;

  return (
    <div className="pagination">
      <button
        type="button"
        className="btn"
        disabled={current <= 1}
        onClick={() => onChange(current - 1)}
      >
        Anterior
      </button>
      <span className="pagination__info">
        Página {current} de {totalPages} · {safeTotal} resultados
      </span>
      <button
        type="button"
        className="btn"
        disabled={current >= totalPages}
        onClick={() => onChange(current + 1)}
      >
        Siguiente
      </button>
    </div>
  );
}
