<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { claims } from "$lib/stores/claims";
  import { startRecording, stopRecording, recordingState } from "$lib/stores/audio";
  import { falseFlash } from "$lib/stores/ui";
  import Modal from "$lib/components/Modal.svelte";

  let falseCount = $derived($claims.filter((c) => c.status === "false").length);
  let prevFalseCount = $state(0);
  let helpOpen = $state(false);

  const shortcuts = [
    { keys: ["Espace"], label: "Démarrer / arrêter l'enregistrement" },
    { keys: ["Échap"], label: "Vider tous les claims" },
    { keys: ["?"], label: "Afficher / masquer cette aide" }
  ];

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

    // Escape while the help modal is open is handled by Modal itself
    // (capture phase + stopPropagation), so it never reaches here.
    if (e.key === "?") {
      e.preventDefault();
      helpOpen = !helpOpen;
      return;
    }
    if (e.code === "Escape") {
      claims.set([]);
      return;
    }
    if (e.code === "Space") {
      e.preventDefault();
      if ($recordingState === "recording") stopRecording();
      else startRecording();
    }
  }

  onMount(() => window.addEventListener("keydown", handleKeydown));
  onDestroy(() => window.removeEventListener("keydown", handleKeydown));
</script>

{#if $falseFlash}
  <div class="false-flash" aria-hidden="true"></div>
{/if}

<button
  class="help-toggle"
  onclick={() => (helpOpen = true)}
  title="Raccourcis clavier (?)"
  aria-label="Afficher les raccourcis clavier">
  ?
</button>

<Modal bind:open={helpOpen} title="Raccourcis clavier">
  <ul>
    {#each shortcuts as s}
      <li>
        <span class="keys">
          {#each s.keys as k}
            <kbd>{k}</kbd>
          {/each}
        </span>
        <span class="desc">{s.label}</span>
      </li>
    {/each}
  </ul>
</Modal>

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
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }

  .help-toggle {
    position: fixed;
    bottom: 1.25rem;
    right: 1.25rem;
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background: #1e1e2e;
    border: 1px solid #3a3a4e;
    color: #9a9ab0;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
    transition: all 0.15s;
  }

  .help-toggle:hover {
    background: #2a2a44;
    color: #fff;
    border-color: #5555aa;
    transform: translateY(-1px);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.9rem;
  }

  .keys {
    display: flex;
    gap: 0.3rem;
    flex-shrink: 0;
    min-width: 70px;
  }

  .desc {
    color: #b8b8c8;
    font-size: 0.88rem;
  }

  kbd {
    background: #12121e;
    border: 1px solid #3a3a4e;
    border-bottom-width: 2px;
    border-radius: 6px;
    padding: 0.2rem 0.55rem;
    font-size: 0.78rem;
    color: #d0d0e0;
    font-family: inherit;
    min-width: 1.2rem;
    text-align: center;
  }
</style>
