import { env } from "$env/dynamic/public";

// Single source of truth for the backend location, shared by the WebSocket
// client and the admin API client. Override with the PUBLIC_BACKEND_URL env
// var (see .env.example) for anything other than local dev; the default keeps
// the app working out of the box on localhost.
const BACKEND_URL = (env.PUBLIC_BACKEND_URL ?? "http://localhost:8000").replace(
  /\/+$/,
  ""
);

// All HTTP API routes are versioned under /v1 (see backend app/main.py). This is the
// single place the prefix is applied — callers pass paths like "/admin/..." unchanged.
export const API_BASE_URL = `${BACKEND_URL}/v1`;

// WebSocket endpoint derived from BACKEND_URL (http→ws, https→wss), also under /v1.
export const WS_URL = `${BACKEND_URL.replace(/^http/, "ws")}/v1/ws`;
