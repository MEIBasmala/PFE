// src/services/api/client.ts
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token & user storage ─────────────────────────────────────
export const setToken = (token: string) => localStorage.setItem('kl_token', token);
export const removeToken = () => localStorage.removeItem('kl_token');
export const setUser = (user: any) => localStorage.setItem('kl_user', JSON.stringify(user));
export const removeUser = () => localStorage.removeItem('kl_user');
export const getToken = (): string | null => localStorage.getItem('kl_token');

export const isAuthenticated = () => !!getToken();
export const getUser = <T = any>(): T | null => {
  const u = localStorage.getItem('kl_user');
  if (!u) return null;
  try { return JSON.parse(u) as T; } catch { return null; }
};

// ── Logout: clears local storage AND asks server to clear the cookie ─────────
export const logout = async (redirect = true) => {
  removeToken();
  removeUser();
  try {
    // Tell the server to clear the httpOnly refreshToken cookie
    await fetch(`${BASE_URL}/auth/refresh/logout`, {
      method: 'POST',
      credentials: 'include', // sends the cookie so server can clear it
    });
  } catch {
    // fire-and-forget — even if this fails, we still redirect
  }
  if (redirect) window.location.href = '/auth';
};

// ── Refresh token state ──────────────────────────────────────
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeToRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function notifyRefreshSubscribers(token: string) {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
}

// ── Try to get a new access token using the httpOnly cookie ──
async function refreshAccessToken(): Promise<string> {
  // The backend reads req.cookies.refreshToken — credentials:'include' sends it automatically
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include', // <-- this is what was missing before
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  const { token } = await res.json();
  setToken(token); // store new access token
  return token;
}

// ── Core fetch wrapper ───────────────────────────────────────
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { skipAuth?: boolean } = {}
): Promise<T> {
  const { skipAuth, ...fetchOptions } = options;
  const token = skipAuth ? null : getToken();
  const url = `${BASE_URL}${endpoint}`;

  const makeRequest = (token: string | null): Promise<Response> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    };
    return fetch(url, {
      ...options,
      headers,
      credentials: 'include', // always include cookies (needed for refresh cookie on retry)
    });
  };

  let response = await makeRequest(getToken());

  // ── 401 handling: attempt one silent refresh ─────────────
    if (
    response.status === 401 &&
    !endpoint.startsWith('/auth/')
  ) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        notifyRefreshSubscribers(newToken);
      } catch {
        // Refresh failed — clear flag and logout
        isRefreshing = false;
        await logout(false);
        throw new Error('Session expired. Please log in again.');
      }
      // On success: isRefreshing stays true until after subscribers retry
    }

    // Wait for the refresh to complete (either ours or another request's)
    const retryToken = await new Promise<string>((resolve) => {
      subscribeToRefresh(resolve);
    });

    // Now all subscribers have their token — safe to clear the flag
    isRefreshing = false;

    response = await makeRequest(retryToken);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ── Blob download wrapper (for CSV, PDF, etc.) ──────────────────
export async function apiFetchBlob(
  endpoint: string,
  options: RequestInit = {}
): Promise<Blob> {
  const token = getToken();
  const url = `${BASE_URL}${endpoint}`;
  const headers: HeadersInit = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.blob();
}

// ── Generic HTTP helpers ─────────────────────────────────────
export const api = {
  get: <T>(path: string, opts?: { skipAuth?: boolean }) =>
    apiFetch<T>(path, { method: 'GET', ...opts }),
  post: <T>(path: string, body?: any, opts?: { skipAuth?: boolean }) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body), ...opts }),
  put: <T>(path: string, body?: any, opts?: { skipAuth?: boolean }) =>
    apiFetch<T>(path, { method: 'PUT', body: JSON.stringify(body), ...opts }),
  patch: <T>(path: string, body?: any, opts?: { skipAuth?: boolean }) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body), ...opts }),
  delete: <T>(path: string, opts?: { skipAuth?: boolean }) =>
    apiFetch<T>(path, { method: 'DELETE', ...opts }),
};