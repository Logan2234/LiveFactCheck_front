import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { BACKEND_URL } from "$lib/config";

const STORAGE_KEY = "lfc_admin_token";

function initialToken(): string | null {
  return browser ? localStorage.getItem(STORAGE_KEY) : null;
}

export const token = writable<string | null>(initialToken());

export function setToken(value: string) {
  if (browser) localStorage.setItem(STORAGE_KEY, value);
  token.set(value);
}

export function clearToken() {
  if (browser) localStorage.removeItem(STORAGE_KEY);
  token.set(null);
}

export function getToken(): string | null {
  return initialToken();
}

/** POST /admin/login → stores the JWT on success, throws a message on failure. */
export async function login(password: string): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password })
  });

  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.detail ?? "Échec de la connexion");
  }

  const data = await res.json();
  setToken(data.token);
}

/** fetch wrapper that attaches the admin bearer token. */
export async function authFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const t = getToken();
  return fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      ...(t ? { Authorization: `Bearer ${t}` } : {})
    }
  });
}
