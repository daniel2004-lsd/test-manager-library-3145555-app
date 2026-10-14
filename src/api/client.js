const BASE_URL = (
  import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'
).replace(/\/+$/, '');

const TOKEN_KEY = 'access_token';
const ROLE_KEY = 'role';

export const UNAUTHORIZED_EVENT = 'ml:unauthorized';

const STATUS_FALLBACK = {
  400: 'La solicitud no es válida.',
  403: 'No tienes permiso para realizar esta acción.',
  404: 'El recurso solicitado no existe.',
  409: 'La operación entra en conflicto con el estado actual.',
  422: 'Los datos enviados no son válidos.',
  500: 'Error interno del servidor.',
};

export class ApiError extends Error {
  constructor(status, body) {
    const message =
      (body && typeof body.message === 'string' && body.message) ||
      STATUS_FALLBACK[status] ||
      'Ocurrió un error inesperado.';
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = (body && body.code) || 'UNKNOWN';
    this.details = body && Array.isArray(body.details) ? body.details : [];
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY);
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function isAdmin() {
  return getRole() === 'admin';
}

export function saveSession({ access_token, role }) {
  localStorage.setItem(TOKEN_KEY, access_token);
  localStorage.setItem(ROLE_KEY, role || 'librarian');
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(ROLE_KEY);
}

function notifyUnauthorized() {
  clearSession();
  window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
}

export function fieldErrors(error) {
  const map = {};
  if (error && Array.isArray(error.details)) {
    for (const detail of error.details) {
      if (detail && detail.field) {
        map[detail.field] = detail.issue || 'Valor inválido.';
      }
    }
  }
  return map;
}

async function toApiError(response) {
  let body = null;
  try {
    body = await response.json();
  } catch (err) {
    body = null;
  }
  return new ApiError(response.status, body);
}

export async function apiFetch(path, options = {}) {
  const { method = 'GET', body, query, headers: extraHeaders, signal } = options;

  const url = new URL(BASE_URL + path, window.location.href);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, String(value));
    }
  }

  const headers = { Accept: 'application/json' };
  if (extraHeaders) Object.assign(headers, extraHeaders);

  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let payload;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined && body !== null) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url.toString(), {
      method,
      headers,
      body: payload,
      signal,
    });
  } catch (err) {
    if (err && err.name === 'AbortError') throw err;
    throw new ApiError(0, {
      code: 'NETWORK_ERROR',
      message: 'No se pudo conectar con el servidor. Verifica que la API esté disponible.',
      details: [],
    });
  }

  if (response.status === 401 && path !== '/auth/login') {
    notifyUnauthorized();
  }

  if (!response.ok) throw await toApiError(response);

  if (response.status === 204) return null;
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (err) {
    return null;
  }
}

export async function fetchCoverUrl(bookId) {
  const url = `${BASE_URL}/books/${bookId}/cover`;
  const token = getToken();
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, { headers });
  } catch (err) {
    return null;
  }

  if (response.status === 401) {
    notifyUnauthorized();
    return null;
  }
  if (!response.ok) return null;

  try {
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (err) {
    return null;
  }
}
