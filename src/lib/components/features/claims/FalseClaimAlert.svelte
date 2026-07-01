<script lang="ts">
  import StatusIcon from "$lib/components/ui/StatusIcon.svelte";
  import { dismissFalseAlert, falseAlerts } from "$lib/stores/alerts";
</script>

{#if $falseAlerts.length > 0}
  <div
    class="pointer-events-none fixed inset-x-0 top-4 z-50 flex flex-col items-center gap-2 px-4">
    {#each $falseAlerts as alert (alert.id)}
      <div
        class="false-alert-in pointer-events-auto w-full max-w-xl rounded-xl border border-red-500/50 bg-red-900/90 px-4 py-3 shadow-lg backdrop-blur"
        role="alert">
        <div class="flex items-start gap-3">
          <!-- rec F: StatusIcon + Barlow Condensed replaces ⚠️ FAUX badge -->
          <span
            class="false-alert-pulse mt-0.5 inline-flex shrink-0 items-center gap-1.5 rounded-md bg-red-600/90 px-2.5 py-1 font-display text-sm font-extrabold tracking-wider text-white uppercase">
            <StatusIcon status="false" size={14} />
            Affirmation fausse
          </span>
          <div class="min-w-0 flex-1">
            <p class="m-0 text-sm text-red-50">{alert.text}</p>
            {#if alert.counterClaim}
              <p class="mt-1 mb-0 text-xs text-red-200/90">
                <span class="font-semibold">En réalité :</span>
                {alert.counterClaim}
              </p>
            {/if}
          </div>
          <button
            class="shrink-0 cursor-pointer rounded-md px-1.5 text-red-200/70 transition-colors hover:bg-red-900/70 dark:hover:bg-red-950/60 hover:text-white"
            onclick={() => dismissFalseAlert(alert.id)}
            aria-label="Fermer l'alerte">
            ✕
          </button>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  @keyframes false-alert-in {
    from {
      opacity: 0;
      transform: translateY(-0.5rem) scale(0.98);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .false-alert-in {
    animation: false-alert-in 0.25s ease-out;
  }

  @keyframes false-alert-pulse {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  .false-alert-pulse {
    animation: false-alert-pulse 1s ease-in-out infinite;
  }
</style>
