<script lang="ts">
  import ClaimCard from "$lib/components/features/claims/ClaimCard.svelte";
  import ClaimFiltersPopover from "$lib/components/features/claims/ClaimFiltersPopover.svelte";
  import StatusIcon from "$lib/components/ui/StatusIcon.svelte";
  import { STATUS_META, STATUS_ORDER } from "$lib/constants/status";
  import { reversedTranscript } from "$lib/stores/audio";
  import { claimStats, filteredClaims } from "$lib/stores/claims";
  import { formatTime } from "$lib/utils/format";
</script>

<div class="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
  <section>
    <h2 class="mt-0 mb-3 text-lg">Transcription</h2>
    <div
      class="flex max-h-115 flex-col gap-1.5 overflow-y-auto rounded-lg bg-surface p-3">
      {#if $reversedTranscript.length === 0}
        <p class="m-0 p-8 text-center text-fg-faint">
          En attente de la transcription...
        </p>
      {:else}
        {#each $reversedTranscript as entry (entry.timestamp)}
          <div
            class="flex items-baseline gap-3 rounded-md bg-surface-raised px-2 py-1.5">
            <span
              class="shrink-0 text-xs whitespace-nowrap tabular-nums text-fg-faint"
              >{formatTime(entry.timestamp)}</span>
            <span class="text-sm leading-normal text-fg">{entry.text}</span>
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <section>
    <div class="mb-2 flex items-start justify-between gap-2">
      <h2 class="mt-0 mb-3 text-lg">
        Claims ({$claimStats.total})
      </h2>
      <ClaimFiltersPopover />
    </div>
    <!-- rec 04: StatusIcon replaces emoji in stats row -->
    <div class="mt-1.5 flex flex-wrap gap-3 text-sm">
      {#each STATUS_ORDER as s (s)}
        <span
          class="flex items-center gap-1"
          style="color: {STATUS_META[s].color}">
          <StatusIcon status={s} size={13} />
          {$claimStats[s]}
        </span>
      {/each}
    </div>
    <div class="mt-3 flex max-h-115 flex-col gap-2 overflow-y-auto">
      {#each $filteredClaims as claim (claim.id)}
        <ClaimCard {claim} />
      {/each}
      {#if $filteredClaims.length === 0}
        <p class="m-0 p-8 text-center text-fg-faint">
          Aucun fait détecté pour le moment...
        </p>
      {/if}
    </div>
  </section>
</div>
