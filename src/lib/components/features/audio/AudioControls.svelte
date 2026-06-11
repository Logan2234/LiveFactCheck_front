<script lang="ts">
  import LanguageSelector from "$lib/components/features/LanguageSelector.svelte";
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

<div class="flex items-center gap-3 px-4 py-3">
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
    <span
      class={[
        "h-2.5 w-2.5 shrink-0 rounded-full",
        isRecording ? "record-dot-animate bg-white" : "bg-red-500"
      ]}></span>
    {isRecording ? "Arrêter" : "Enregistrer"}
  </button>

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

  <LanguageSelector />

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
  /* Custom pulse (opacity 1 → 0.3, 1s) — distinct from Tailwind's built-in animate-pulse. */
  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }

  .record-dot-animate {
    animation: pulse 1s infinite;
  }
</style>
