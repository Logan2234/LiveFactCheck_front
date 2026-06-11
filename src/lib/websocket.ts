import { writable } from "svelte/store";
import type { Claim, VerificationStatus } from "./stores/claims";
import { WS_URL } from "./config";

export type WSMessage =
  | { type: "transcript"; text: string }
  | { type: "claim"; claim: Claim }
  | { type: "remove_claim"; id: string };

const VERIFICATION_STATUSES: readonly VerificationStatus[] = [
  "pending",
  "verified",
  "false",
  "uncertain",
  "unverifiable"
];

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

// Validate the wire payload before trusting it (parse-and-validate, svelte.md).
// Mirrors the Pydantic Claim in backend/app/schemas/claim.py — keep in sync.
function isClaim(value: unknown): value is Claim {
  if (typeof value !== "object" || value === null) return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === "string" &&
    typeof c.text === "string" &&
    typeof c.status === "string" &&
    VERIFICATION_STATUSES.includes(c.status as VerificationStatus) &&
    typeof c.explanation === "string" &&
    isStringArray(c.sources) &&
    typeof c.timestamp === "number" &&
    Number.isFinite(c.timestamp) &&
    typeof c.category === "string" &&
    typeof c.confidence === "number" &&
    Number.isFinite(c.confidence) &&
    typeof c.counter_claim === "string" &&
    typeof c.web_search_used === "boolean"
  );
}

function parseWSMessage(raw: unknown): WSMessage | null {
  if (typeof raw !== "object" || raw === null) return null;
  const msg = raw as Record<string, unknown>;
  switch (msg.type) {
    case "transcript":
      return typeof msg.text === "string" ? { type: "transcript", text: msg.text } : null;
    case "claim":
      return isClaim(msg.claim) ? { type: "claim", claim: msg.claim } : null;
    case "remove_claim":
      return typeof msg.id === "string" ? { type: "remove_claim", id: msg.id } : null;
    default:
      return null;
  }
}

export type WSStatus = "disconnected" | "connecting" | "connected" | "error";

export const wsStatus = writable<WSStatus>("disconnected");

let ws: WebSocket | null = null;
let onClaimCallback: ((claim: Claim) => void) | null = null;
let onRemoveClaimCallback: ((id: string) => void) | null = null;
let onTranscriptCallback: ((text: string) => void) | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let retryCount = 0;
let manualDisconnect = false;

const MAX_RETRIES = 8;
const BASE_DELAY_MS = 1000;

function scheduleRetry() {
  if (manualDisconnect || retryCount >= MAX_RETRIES) {
    if (retryCount >= MAX_RETRIES) wsStatus.set("error");
    return;
  }
  // Exponential backoff plafonné à 30s : 1s, 2s, 4s, 8s, 16s, 30s, 30s…
  const delay = Math.min(BASE_DELAY_MS * 2 ** retryCount, 30_000);
  retryCount++;
  console.log(
    `WebSocket: reconnexion dans ${delay / 1000}s (tentative ${retryCount}/${MAX_RETRIES})`
  );
  retryTimer = setTimeout(() => connect(false), delay);
}

export function connect(resetRetries = true) {
  if (ws?.readyState === WebSocket.OPEN) return;
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  if (resetRetries) {
    retryCount = 0;
    manualDisconnect = false;
  }

  wsStatus.set("connecting");
  ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    retryCount = 0;
    wsStatus.set("connected");
    console.log("WebSocket connecté");
  };

  ws.onmessage = (event) => {
    let raw: unknown;
    try {
      raw = JSON.parse(event.data);
    } catch (e) {
      console.error("Failed to parse WS message:", e);
      return;
    }
    const message = parseWSMessage(raw);
    if (message === null) {
      console.warn("Discarding malformed WS message:", raw);
      return;
    }
    switch (message.type) {
      case "transcript":
        onTranscriptCallback?.(message.text);
        break;
      case "claim":
        onClaimCallback?.(message.claim);
        break;
      case "remove_claim":
        onRemoveClaimCallback?.(message.id);
        break;
    }
  };

  ws.onerror = () => {
    wsStatus.set("error");
  };

  ws.onclose = () => {
    ws = null;
    if (!manualDisconnect) {
      wsStatus.set("disconnected");
      scheduleRetry();
    } else {
      wsStatus.set("disconnected");
    }
  };
}

export function disconnect() {
  manualDisconnect = true;
  if (retryTimer !== null) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }
  ws?.close();
  ws = null;
  wsStatus.set("disconnected");
}

export function sendAudioChunk(chunk: Blob) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(chunk);
  }
}

export function onClaim(callback: (claim: Claim) => void) {
  onClaimCallback = callback;
}

export function onRemoveClaim(callback: (id: string) => void) {
  onRemoveClaimCallback = callback;
}

export function onTranscript(callback: (text: string) => void) {
  onTranscriptCallback = callback;
}
