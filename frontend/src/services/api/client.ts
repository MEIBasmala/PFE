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
  try { 
    const parsed = JSON.parse(u) as T;
    // Validate it's actually a valid user object
    if (parsed && typeof parsed === 'object' && 'id' in parsed && 'role' in parsed) {
      return parsed;
    }
    return null;
  } catch { 
    return null; 
  }
};

// ── Logout: clears local storage AND asks server to clear the cookie ─────────
export const logout = async (redirect = true) => {
  removeToken();
  removeUser();
  try {
    await fetch(`${BASE_URL}/auth/refresh/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch {
    // fire-and-forget
  }
  // NEVER use window.location.href in a React SPA — it breaks Vercel routing
  // Instead, let the caller handle navigation via React Router
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
  const res = await fetch(`${BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    throw new Error('Refresh failed');
  }

  const { token } = await res.json();
  setToken(token);
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
      credentials: 'include',
    });
  };

  let response = await makeRequest(getToken());

  // ── 401 handling: attempt one silent refresh ─────────────
  if (response.status === 401 && !endpoint.startsWith('/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const newToken = await refreshAccessToken();
        notifyRefreshSubscribers(newToken);
      } catch {
        notifyRefreshSubscribers('');
        isRefreshing = false;
        refreshSubscribers = [];
        await logout(false);
        throw new Error('Session expired. Please log in again.');
      }
      isRefreshing = false;
    }

    const retryToken = await new Promise<string>((resolve) => {
      subscribeToRefresh(resolve);
    });

    if (!retryToken) {
      throw new Error('Session expired. Please log in again.');
    }

    response = await makeRequest(retryToken);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

// ── Blob download wrapper ──────────────────
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