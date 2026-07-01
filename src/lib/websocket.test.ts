import { get } from "svelte/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Claim } from "$lib/stores/claims";

// A controllable stand-in for the browser WebSocket. The module under test holds
// a private reference to `new WebSocket(...)`, so tests drive the socket through
// the captured instance (open/message/close) and assert on reconnection by
// counting how many instances the module created.
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  sent: (string | ArrayBuffer)[] = [];

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  send(data: string | ArrayBuffer) {
    this.sent.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
  }

  // --- test helpers (not part of the real WebSocket API) ---
  open() {
    this.readyState = MockWebSocket.OPEN;
    this.onopen?.();
  }

  emit(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }

  emitRaw(data: string) {
    this.onmessage?.({ data });
  }

  fireClose() {
    this.readyState = MockWebSocket.CLOSED;
    this.onclose?.();
  }
}

function makeClaim(overrides: Partial<Claim> = {}): Claim {
  return {
    id: "c1",
    text: "the earth is round",
    status: "verified",
    explanation: "",
    sources: [],
    timestamp: 1_700_000_000_000,
    category: "science",
    confidence: 9,
    counter_claim: "",
    web_search_used: false,
    ...overrides
  };
}

// Re-imported fresh in each test so the module's private state (ws, retryCount,
// manualDisconnect, timers) never leaks across tests.
let ws: typeof import("$lib/websocket");

beforeEach(async () => {
  MockWebSocket.instances = [];
  vi.stubGlobal("WebSocket", MockWebSocket);
  vi.useFakeTimers();
  vi.resetModules();
  ws = await import("$lib/websocket");
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

/** Connect and drive the socket to the OPEN state, returning the live instance. */
function connectAndOpen(): MockWebSocket {
  ws.connect();
  const socket = MockWebSocket.instances.at(-1)!;
  socket.open();
  return socket;
}

describe("message routing", () => {
  it("routes a claim message to the claim callback", () => {
    const onClaim = vi.fn();
    ws.onClaim(onClaim);
    const socket = connectAndOpen();

    const claim = makeClaim();
    socket.emit({ type: "claim", claim });

    expect(onClaim).toHaveBeenCalledOnce();
    expect(onClaim).toHaveBeenCalledWith(claim);
  });

  it("routes a remove_claim message to the remove callback", () => {
    const onRemove = vi.fn();
    ws.onRemoveClaim(onRemove);
    const socket = connectAndOpen();

    socket.emit({ type: "remove_claim", id: "c1" });

    expect(onRemove).toHaveBeenCalledExactlyOnceWith("c1");
  });

  it("routes a transcript message to the transcript callback", () => {
    const onTranscript = vi.fn();
    ws.onTranscript(onTranscript);
    const socket = connectAndOpen();

    socket.emit({ type: "transcript", text: "hello world" });

    expect(onTranscript).toHaveBeenCalledExactlyOnceWith("hello world");
  });

  it("stores the detected language when transcript carries one", () => {
    const socket = connectAndOpen();

    socket.emit({
      type: "transcript",
      text: "bonjour",
      language: "fr",
      language_probability: 0.98
    });

    expect(get(ws.detectedLanguage)).toEqual({ code: "fr", probability: 0.98 });
  });

  it("ignores an unknown message type", () => {
    const onClaim = vi.fn();
    const onRemove = vi.fn();
    const onTranscript = vi.fn();
    ws.onClaim(onClaim);
    ws.onRemoveClaim(onRemove);
    ws.onTranscript(onTranscript);
    const socket = connectAndOpen();

    socket.emit({ type: "nonsense", foo: 1 });

    expect(onClaim).not.toHaveBeenCalled();
    expect(onRemove).not.toHaveBeenCalled();
    expect(onTranscript).not.toHaveBeenCalled();
  });

  it("discards a claim message with a malformed claim payload", () => {
    const onClaim = vi.fn();
    ws.onClaim(onClaim);
    const socket = connectAndOpen();

    // Missing required fields → isClaim() rejects it.
    socket.emit({ type: "claim", claim: { id: "c1" } });

    expect(onClaim).not.toHaveBeenCalled();
  });

  it("swallows invalid JSON without invoking any callback", () => {
    const onClaim = vi.fn();
    ws.onClaim(onClaim);
    const socket = connectAndOpen();

    socket.emitRaw("{not json");

    expect(onClaim).not.toHaveBeenCalled();
  });
});

describe("connection lifecycle", () => {
  it("sets the status to connected on open", () => {
    connectAndOpen();
    expect(get(ws.wsStatus)).toBe("connected");
  });

  it("does not open a second socket when already connected", () => {
    connectAndOpen();
    ws.connect();
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("sets the status to error when the socket errors", () => {
    const socket = connectAndOpen();
    socket.onerror?.();
    expect(get(ws.wsStatus)).toBe("error");
  });
});

describe("reconnection backoff", () => {
  it("reconnects with an exponential delay after an unexpected close", () => {
    connectAndOpen();

    // First drop: retry after 1s.
    MockWebSocket.instances.at(-1)!.fireClose();
    expect(get(ws.wsStatus)).toBe("disconnected");
    vi.advanceTimersByTime(999);
    expect(MockWebSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(2);

    // Second drop (socket stays CONNECTING): retry after 2s.
    MockWebSocket.instances.at(-1)!.fireClose();
    vi.advanceTimersByTime(1999);
    expect(MockWebSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(MockWebSocket.instances).toHaveLength(3);

    // Third drop: retry after 4s.
    MockWebSocket.instances.at(-1)!.fireClose();
    vi.advanceTimersByTime(4000);
    expect(MockWebSocket.instances).toHaveLength(4);
  });

  it("resets the backoff once a reconnection succeeds", () => {
    connectAndOpen();

    MockWebSocket.instances.at(-1)!.fireClose();
    vi.advanceTimersByTime(1000); // 2nd socket created (retryCount now 1)
    MockWebSocket.instances.at(-1)!.open(); // success → retryCount back to 0

    // Next drop must restart at the base 1s delay, not 2s.
    MockWebSocket.instances.at(-1)!.fireClose();
    vi.advanceTimersByTime(1000);
    expect(MockWebSocket.instances).toHaveLength(3);
  });

  it("gives up and reports error after MAX_RETRIES failed attempts", () => {
    connectAndOpen();

    // MAX_RETRIES = 8: it takes 9 closes to exhaust the budget — the first 8
    // each schedule a retry (retryCount 0→8), the 9th trips the guard.
    for (let i = 0; i < 9; i++) {
      MockWebSocket.instances.at(-1)!.fireClose();
      vi.advanceTimersByTime(30_000); // past the 30s cap, fire any pending retry
    }

    expect(get(ws.wsStatus)).toBe("error");
  });
});

describe("manual disconnect", () => {
  it("does not schedule a reconnection", () => {
    connectAndOpen();

    ws.disconnect();
    expect(get(ws.wsStatus)).toBe("disconnected");

    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });

  it("cancels a pending retry scheduled by a prior drop", () => {
    connectAndOpen();

    MockWebSocket.instances.at(-1)!.fireClose(); // schedules a retry
    ws.disconnect(); // must clear the pending timer

    vi.advanceTimersByTime(60_000);
    expect(MockWebSocket.instances).toHaveLength(1);
  });
});
