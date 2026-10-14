export default function Banner({ message, type = 'error' }) {
  if (!message) return null;
  return <div className={`banner banner--${type}`}>{message}</div>;
}

export function FieldError({ message }) {
  if (!message) return null;
  return <span className="field-error">{message}</span>;
}
