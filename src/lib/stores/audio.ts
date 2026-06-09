import { writable } from "svelte/store";

export type RecordingState = "idle" | "recording" | "paused";

export interface TranscriptEntry {
  text: string;
  timestamp: number;
}

export const recordingState = writable<RecordingState>("idle");
export const transcriptEntries = writable<TranscriptEntry[]>([]);
export const isMuted = writable(false);
// User-facing error when recording can't start (mic permission / no device).
// null when there's nothing to show.
export const audioError = writable<string | null>(null);

let activeStream: MediaStream | null = null;
let activeRecorder: MediaRecorder | null = null;
let chunkTimer: ReturnType<typeof setTimeout> | null = null;
let onChunkCallback: ((chunk: Blob) => void) | null = null;
let isRecording = false;

// Shared with the backend contract: each chunk is a self-contained ~5 s
// WebM/Opus blob. The backend transcribes per-chunk assuming this ~5 s window,
// so keep this in sync with that assumption (see root CLAUDE.md, WS contract).
const CHUNK_INTERVAL_MS = 5000;

function recordOneChunk() {
  if (!isRecording || !activeStream) return;

  const recorder = new MediaRecorder(activeStream, {
    mimeType: "audio/webm;codecs=opus"
  });
  activeRecorder = recorder;
  const chunks: Blob[] = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    if (chunks.length > 0 && onChunkCallback) {
      onChunkCallback(new Blob(chunks, { type: "audio/webm;codecs=opus" }));
    }
    if (isRecording) recordOneChunk();
  };

  recorder.start();
  chunkTimer = setTimeout(() => {
    if (recorder.state !== "inactive") recorder.stop();
  }, CHUNK_INTERVAL_MS);
}

export async function startRecording() {
  audioError.set(null);
  try {
    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    isRecording = true;
    recordingState.set("recording");
    recordOneChunk();
  } catch (error) {
    console.error("Failed to start recording:", error);
    audioError.set(micErrorMessage(error));
  }
}

/** Maps a getUserMedia failure to a clear, user-facing message. */
function micErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Accès au micro refusé. Autorisez le micro dans votre navigateur, puis réessayez.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "Aucun micro détecté. Branchez un micro, puis réessayez.";
    }
  }
  return "Impossible de démarrer l'enregistrement du micro.";
}

export function stopRecording() {
  isRecording = false;
  if (chunkTimer !== null) {
    clearTimeout(chunkTimer);
    chunkTimer = null;
  }
  if (activeRecorder && activeRecorder.state !== "inactive") {
    activeRecorder.stop();
  }
  activeRecorder = null;
  if (activeStream) {
    activeStream.getTracks().forEach((track) => track.stop());
    activeStream = null;
  }
  recordingState.set("idle");
}

export function toggleMute() {
  if (!activeStream) return;
  isMuted.update((muted) => {
    const next = !muted;
    activeStream!.getAudioTracks().forEach((t) => (t.enabled = !next));
    return next;
  });
}

export function onAudioChunk(callback: (chunk: Blob) => void) {
  onChunkCallback = callback;
}

export function appendTranscript(text: string) {
  transcriptEntries.update((entries) => [...entries, { text, timestamp: Date.now() }]);
}
