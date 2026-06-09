<script lang="ts">
  import Modal from "$lib/components/Modal.svelte";
  import { recordingState, startRecording, stopRecording } from "$lib/stores/audio";
  import { claims } from "$lib/stores/claims";
  import { falseFlash } from "$lib/stores/ui";
  import { onDestroy, onMount } from "svelte";

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
  <div
    class="false-flash pointer-events-none fixed inset-0 z-9999 bg-red-500/18"
    aria-hidden="true">
  </div>
{/if}

<button
  class="fixed right-5 bottom-5 z-9000 flex h-9.5 w-9.5 cursor-pointer items-center justify-center rounded-full border border-edge-hi bg-surface text-base font-semibold text-fg-muted shadow-[0_4px_14px_rgba(0,0,0,0.4)] transition-all duration-150 hover:-translate-y-px hover:border-accent-dim hover:bg-[#2a2a44] hover:text-white"
  onclick={() => (helpOpen = true)}
  title="Raccourcis clavier (?)"
  aria-label="Afficher les raccourcis clavier">
  ?
</button>

<Modal bind:open={helpOpen} title="Raccourcis clavier">
  <ul class="m-0 flex list-none flex-col gap-2.5 p-0">
    {#each shortcuts as s (s.label)}
      <li class="flex items-center gap-3.5">
        <span class="flex min-w-17.5 shrink-0 gap-1.5">
          {#each s.keys as k (k)}
            <kbd
              class="min-w-5 rounded-md border border-b-2 border-edge-hi bg-background px-2 py-1 text-center font-[inherit] text-xs text-fg"
              >{k}</kbd>
          {/each}
        </span>
        <span class="text-sm text-fg-muted">{s.label}</span>
      </li>
    {/each}
  </ul>
</Modal>

<style>
  /* Flash overlay animation — keyframes can't be expressed as utilities. */
  .false-flash {
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
</style>
