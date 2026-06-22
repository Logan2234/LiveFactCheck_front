<script lang="ts">
  import { languageName } from "$lib/languages";
  import {
    audioError,
    isMuted,
    recordingState,
    startRecording,
    stopRecording,
    toggleMute
  } from "$lib/stores/audio";
  import { transcriptionLanguage } from "$lib/stores/transcription";
  import { detectedLanguage, wsStatus } from "$lib/websocket";

  let isRecording = $derived($recordingState === "recording");
  let status = $derived($wsStatus);

  function toggle() {
    if (isRecording) {
      stopRecording();
    } else {
      void startRecording();
    }
  }

  wsStatus.subscribe((value) => {
    if (value === "disconnected" && isRecording) {
      stopRecording();
    }
  });
</script>

<div class="flex flex-wrap items-center gap-2">
  <button
    class={[
      "flex cursor-pointer items-center gap-2 rounded-full px-5 py-2.5 text-base transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50",
      isRecording
        ? "bg-red-600 text-white"
        : "bg-surface-raised text-fg enabled:hover:bg-surface-selected"
    ]}
    onclick={toggle}
    disabled={status !== "connected"}
    title="Espace pour démarrer/arrêter">
    {#if isRecording}
      <!-- rec 05: waveform replaces static dot during recording -->
      <span class="waveform" aria-hidden="true">
        <span class="bar" style="--delay:0s"></span>
        <span class="bar" style="--delay:0.12s"></span>
        <span class="bar" style="--delay:0.22s"></span>
        <span class="bar" style="--delay:0.06s"></span>
        <span class="bar" style="--delay:0.16s"></span>
      </span>
    {:else}
      <span class="h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"></span>
    {/if}
    {isRecording ? "Arrêter" : "Enregistrer"}
  </button>

  <!-- rec 05: LIVE badge appears while recording -->
  {#if isRecording}
    <span class="live-label" aria-live="polite">● LIVE</span>
  {/if}

  {#if isRecording}
    <button
      class={[
        "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border p-0 text-base transition-all duration-150",
        $isMuted
          ? "border-red-500/40 bg-red-500/15"
          : "border-edge-hi bg-surface hover:border-edge-hi hover:bg-surface-raised"
      ]}
      onclick={toggleMute}
      title={$isMuted ? "Réactiver le micro" : "Couper le micro"}
      aria-label={$isMuted ? "Réactiver le micro" : "Couper le micro"}>
      {$isMuted ? "🔇" : "🎙"}
    </button>
  {/if}

  {#if $transcriptionLanguage === "auto" && $detectedLanguage}
    <span
      class="flex items-center gap-1 rounded-full border border-edge bg-surface px-2.5 py-1 text-2xs text-fg-muted"
      title="Langue détectée automatiquement">
      <span aria-hidden="true">🌐</span>
      <span class="font-medium text-fg"
        >{languageName($detectedLanguage.code)}</span>
      <span class="text-fg-faint"
        >{Math.round($detectedLanguage.probability * 100)} %</span>
    </span>
  {/if}

  <span class="text-sm text-fg-muted">
    {status === "connected"
      ? "🟢 Connecté"
      : status === "connecting"
        ? "🟡 Connexion..."
        : status === "error"
          ? "⛔ Backend injoignable"
          : "🔴 Déconnecté"}
  </span>

  {#if $audioError}
    <span class="text-sm text-red-400" role="alert">⚠️ {$audioError}</span>
  {/if}
</div>

<style>
  .waveform {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    height: 16px;
    flex-shrink: 0;
  }

  .bar {
    display: block;
    width: 2.5px;
    height: 100%;
    background: white;
    border-radius: 2px;
    transform-origin: bottom;
    animation: wave-bar 0.75s ease-in-out infinite alternate;
    animation-delay: var(--delay, 0s);
  }

  @keyframes wave-bar {
    from {
      transform: scaleY(0.15);
    }
    to {
      transform: scaleY(1);
    }
  }

  .live-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.1em;
    color: var(--color-accent);
  }
</style>
