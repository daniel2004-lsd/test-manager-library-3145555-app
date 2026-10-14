export function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

export const STATUS_LABELS = {
  open: 'Abierto',
  overdue: 'Vencido',
  closed: 'Cerrado',
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || '—';
}

export function listOf(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.items)) return payload.items;
  return [];
}

export function memberNameOf(loan) {
  if (!loan) return '—';
  if (loan.member_name) return loan.member_name;
  if (loan.member && loan.member.full_name) return loan.member.full_name;
  if (loan.member_id) return String(loan.member_id).slice(0, 8);
  return '—';
}

export function byDateDesc(field) {
  return (a, b) => {
    const left = a[field] ? new Date(a[field]).getTime() : 0;
    const right = b[field] ? new Date(b[field]).getTime() : 0;
    return right - left;
  };
}
