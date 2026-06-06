<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { claims } from "$lib/stores/claims";
  import { startRecording, stopRecording, recordingState } from "$lib/stores/audio";
  import { falseFlash } from "$lib/stores/ui";

  let falseCount = $derived($claims.filter((c) => c.status === "false").length);
  let prevFalseCount = $state(0);

  $effect(() => {
    if (falseCount > prevFalseCount) {
      falseFlash.set(true);
      setTimeout(() => falseFlash.set(false), 600);
    }
    prevFalseCount = falseCount;
  });

  function handleKeydown(e: KeyboardEvent) {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.code === "Space") {
      e.preventDefault();
      if ($recordingState === "recording") stopRecording();
      else startRecording();
    }
    if (e.code === "Escape") {
      claims.set([]);
    }
  }

  onMount(() => window.addEventListener("keydown", handleKeydown));
  onDestroy(() => window.removeEventListener("keydown", handleKeydown));
</script>

{#if $falseFlash}
  <div class="false-flash" aria-hidden="true"></div>
{/if}
<div class="shortcuts-hint">
  <kbd>Espace</kbd> démarrer/arrêter &nbsp;·&nbsp; <kbd>Échap</kbd> vider les claims
</div>

<style>
  .false-flash {
    position: fixed;
    inset: 0;
    background: rgba(239, 68, 68, 0.18);
    pointer-events: none;
    z-index: 9999;
    animation: flash-fade 0.6s ease-out forwards;
  }

  @keyframes flash-fade {
    0% { opacity: 1; }
    100% { opacity: 0; }
  }

  .shortcuts-hint {
    font-size: 0.75rem;
    color: #444;
    margin-bottom: 1rem;
    text-align: right;
  }

  kbd {
    background: #1e1e2e;
    border: 1px solid #3e3e4e;
    border-radius: 4px;
    padding: 0.1rem 0.4rem;
    font-size: 0.72rem;
    color: #888;
    font-family: inherit;
  }
</style>
