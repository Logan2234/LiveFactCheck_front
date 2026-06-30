import { writable } from "svelte/store";
import { browser } from "$app/environment";
import { API_BASE_URL } from "$lib/config";
import { setUserToken } from "$lib/websocket";

// User accounts (distinct from the admin panel in stores/auth.ts). The token is kept in
// localStorage and mirrored onto the live WebSocket via setUserToken, so the session is
// bound to the signed-in user and their alerts fire on matching claims.

const STORAGE_KEY = "lfc_user_token";

export interface CurrentUser {
  id: string;
  email: string;
  username: string;
  is_active: boolean;
  created_at: string;
}

function storedToken(): string | null {
  return browser ? localStorage.getItem(STORAGE_KEY) : null;
}

export const userToken = writable<string | null>(storedToken());
export const currentUser = writable<CurrentUser | null>(null);

// Bind the live session to the stored token at load (no-op until the socket opens).
if (browser) setUserToken(storedToken());

function setToken(token: string | null) {
  if (browser) {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  }
  userToken.set(token);
  setUserToken(token); // the live WS session follows the auth state
}

export function getUserToken(): string | null {
  return storedToken();
}

/** fetch wrapper that targets the API and attaches the user bearer token. */
export async function userFetch(
  path: string,
  init: RequestInit = {}
): Promise<Response> {
  const t = getUserToken();
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      ...init.headers,
      ...(t ? { Authorization: `Bearer ${t}` } : {})
    }
  });
}

async function errorMessage(res: Response, fallback: string): Promise<string> {
  const body = await res.json().catch(() => null);
  const detail = body?.detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

/** Load the signed-in user into `currentUser`; clears it (and the token) on 401. */
export async function refreshMe(): Promise<void> {
  if (!getUserToken()) {
    currentUser.set(null);
    return;
  }
  const res = await userFetch("/users/me");
  if (res.status === 401) {
    setToken(null);
    currentUser.set(null);
    return;
  }
  if (res.ok) currentUser.set(await res.json());
}

export async function login(
  identifier: string,
  password: string
): Promise<void> {
  const res = await userFetch("/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password })
  });
  if (!res.ok)
    throw new Error(await errorMessage(res, "Échec de la connexion"));
  const data = await res.json();
  setToken(data.token);
  await refreshMe();
}

export async function signup(
  email: string,
  username: string,
  password: string
): Promise<void> {
  const res = await userFetch("/users/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, username, password })
  });
  if (!res.ok)
    throw new Error(await errorMessage(res, "Échec de l'inscription"));
  // Signup returns the user, not a token — log in to get one.
  await login(username, password);
}

export function logout() {
  setToken(null);
  currentUser.set(null);
}
