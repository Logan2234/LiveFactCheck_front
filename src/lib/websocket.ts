import { writable } from "svelte/store";
import type { Claim } from "./stores/claims";
import { WS_URL } from "./config";

export type WSMessage =
  | { type: "transcript"; text: string }
  | { type: "claim"; claim: Claim }
  | { type: "remove_claim"; id: string };

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
    try {
      const data = JSON.parse(event.data);
      if (data.type === "transcript" && onTranscriptCallback) {
        onTranscriptCallback(data.text);
      } else if (data.type === "claim" && onClaimCallback) {
        onClaimCallback(data.claim);
      } else if (data.type === "remove_claim" && onRemoveClaimCallback) {
        onRemoveClaimCallback(data.id);
      }
    } catch (e) {
      console.error("Failed to parse WS message:", e);
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
