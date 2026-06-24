import { derived, writable } from "svelte/store";

export type RecordingState = "idle" | "recording" | "paused";

export interface TranscriptEntry {
  text: string;
  timestamp: number;
}

export const recordingState = writable<RecordingState>("idle");
export const transcriptEntries = writable<TranscriptEntry[]>([]);

// Newest-first view of the transcript, mirroring sortedClaims. Layouts render
// most-recent-on-top from here instead of each reversing the list themselves.
export const reversedTranscript = derived(transcriptEntries, ($entries) =>
  [...$entries].reverse()
);
export const isMuted = writable(false);
// User-facing error when recording can't start (mic permission / no device).
// null when there's nothing to show.
export const audioError = writable<string | null>(null);

let activeStream: MediaStream | null = null;
let audioContext: AudioContext | null = null;
let sourceNode: MediaStreamAudioSourceNode | null = null;
let workletNode: AudioWorkletNode | null = null;
let onChunkCallback: ((chunk: ArrayBuffer) => void) | null = null;

// The PCM downsampler worklet is served from /static (see static/pcm-worklet.js).
const WORKLET_URL = "/pcm-worklet.js";

export async function startRecording() {
  audioError.set(null);

  try {
    activeStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // Stream raw PCM continuously instead of recording 5 s slices: the backend
    // cuts utterances on natural pauses, so there's no per-chunk capture gap.
    audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule(WORKLET_URL);
    // May start suspended under the autoplay policy; resume so process() runs.
    await audioContext.resume();
    sourceNode = audioContext.createMediaStreamSource(activeStream);
    workletNode = new AudioWorkletNode(audioContext, "pcm-downsampler");
    workletNode.port.onmessage = (e) =>
      onChunkCallback?.(e.data as ArrayBuffer);

    // The worklet emits silence; the connection to destination only keeps it in
    // the render graph (an unconnected node isn't pulled). No mic playback.
    sourceNode.connect(workletNode);
    workletNode.connect(audioContext.destination);

    recordingState.set("recording");
  } catch (error) {
    console.error("Failed to start recording:", error);
    audioError.set(micErrorMessage(error));
    stopRecording();
  }
}

/** Maps a getUserMedia failure to a clear, user-facing message. */
function micErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "Accès au micro refusé. Autorisez le micro dans votre navigateur, puis réessayez.";
    }

    if (
      error.name === "NotFoundError" ||
      error.name === "DevicesNotFoundError"
    ) {
      return "Aucun micro détecté. Branchez un micro, puis réessayez.";
    }
  }

  return "Impossible de démarrer l'enregistrement du micro.";
}

export function stopRecording() {
  if (workletNode) {
    workletNode.port.onmessage = null;
    workletNode.disconnect();
    workletNode = null;
  }

  if (sourceNode) {
    sourceNode.disconnect();
    sourceNode = null;
  }

  if (audioContext) {
    void audioContext.close();
    audioContext = null;
  }

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

export function onAudioChunk(callback: (chunk: ArrayBuffer) => void) {
  onChunkCallback = callback;
}

export function appendTranscript(text: string) {
  transcriptEntries.update((entries) => [
    ...entries,
    { text, timestamp: Date.now() }
  ]);
}
