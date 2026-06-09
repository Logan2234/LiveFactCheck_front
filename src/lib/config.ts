import { env } from "$env/dynamic/public";

// Single source of truth for the backend location, shared by the WebSocket
// client and the admin API client. Override with the PUBLIC_BACKEND_URL env
// var (see .env.example) for anything other than local dev; the default keeps
// the app working out of the box on localhost.
export const BACKEND_URL = (env.PUBLIC_BACKEND_URL ?? "http://localhost:8000").replace(/\/+$/, "");

// WebSocket endpoint derived from BACKEND_URL (http→ws, https→wss).
export const WS_URL = `${BACKEND_URL.replace(/^http/, "ws")}/ws`;
