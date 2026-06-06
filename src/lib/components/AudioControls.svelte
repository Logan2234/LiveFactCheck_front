<script lang="ts">
  import { recordingState, startRecording, stopRecording, isMuted, toggleMute } from "$lib/stores/audio";
  import { wsStatus } from "$lib/websocket";

  let isRecording = $derived($recordingState === "recording");
  let status = $derived($wsStatus);

  function toggle() {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }

  wsStatus.subscribe((value) => {
    if (value === "disconnected" && isRecording) {
      stopRecording();
    }
  });
</script>

<div class="audio-controls">
  <button
    class="record-btn"
    class:recording={isRecording}
    onclick={toggle}
    disabled={status !== "connected"}
    title="Espace pour démarrer/arrêter"
  >
    <span class="record-dot"></span>
    {isRecording ? "Arrêter" : "Enregistrer"}
  </button>

  {#if isRecording}
    <button
      class="mute-btn"
      class:muted={$isMuted}
      onclick={toggleMute}
      title={$isMuted ? "Réactiver le micro" : "Couper le micro"}
      aria-label={$isMuted ? "Réactiver le micro" : "Couper le micro"}
    >
      {$isMuted ? "🔇" : "🎙"}
    </button>
  {/if}

  <span class="ws-status" class:connected={status === "connected"}>
    {status === "connected"
      ? "🟢 Connecté"
      : status === "connecting"
        ? "🟡 Connexion..."
        : "🔴 Déconnecté"}
  </span>
</div>

<style>
  .audio-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .record-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.65rem 1.25rem;
    border: none;
    border-radius: 999px;
    background: #2d2d3d;
    color: white;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .record-btn:hover:not(:disabled) {
    background: #3d3d4d;
  }

  .record-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .record-btn.recording {
    background: #dc2626;
  }

  .record-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ef4444;
    flex-shrink: 0;
  }

  .recording .record-dot {
    animation: pulse 1s infinite;
    background: white;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }

  .mute-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    border: 1px solid #3e3e4e;
    background: #1e1e2e;
    font-size: 1rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    padding: 0;
  }

  .mute-btn:hover {
    background: #2e2e3e;
    border-color: #555;
  }

  .mute-btn.muted {
    background: #3a1a1a;
    border-color: #7f1d1d;
  }

  .ws-status {
    font-size: 0.82rem;
    color: #888;
  }
</style>
