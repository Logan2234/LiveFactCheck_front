// Shared client for the auth-gated /admin/* API: wraps authFetch with the
// error handling every admin page repeated (401 → clear token + redirect,
// backend `detail` surfaced otherwise).

import { authFetch, clearToken } from "$lib/stores/auth";

/** Thrown on a 401 from an admin endpoint, *after* the token has been cleared.
 *  Callers should swallow it — the admin layout reacts to the cleared token and
 *  redirects to /login, so there is no error to show. */
export class AdminAuthError extends Error {
  constructor() {
    super("Session expirée");
    this.name = "AdminAuthError";
  }
}

/** authFetch + standard admin handling: clears the token and throws
 *  {@link AdminAuthError} on 401, throws the backend `detail` (or
 *  `Erreur <status>`) on other failures, otherwise returns the parsed JSON. */
export async function adminJson<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const res = await authFetch(path, init);
  if (res.status === 401) {
    clearToken();
    throw new AdminAuthError();
  }
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? `Erreur ${res.status}`);
  }
  return (await res.json()) as T;
}
