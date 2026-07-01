<script lang="ts">
  import ClaimCard from "$lib/components/features/claims/ClaimCard.svelte";
  import ClaimFiltersPopover from "$lib/components/features/claims/ClaimFiltersPopover.svelte";
  import StatusIcon from "$lib/components/ui/StatusIcon.svelte";
  import { STATUS_META, STATUS_ORDER } from "$lib/constants/status";
  import { reversedTranscript } from "$lib/stores/audio";
  import { claimFilter, claimStats, filteredClaims } from "$lib/stores/claims";
  import { formatTime } from "$lib/utils/format";

  const statCards = STATUS_ORDER.map((key) => ({
    key,
    label: STATUS_META[key].filterLabel,
    color: STATUS_META[key].color
  }));
</script>

<div class="flex flex-col gap-5">
  <div class="grid grid-cols-5 gap-3 max-[900px]:grid-cols-3">
    {#each statCards as s (s.key)}
      <button
        class={[
          "stat-tile relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl border bg-surface px-3 py-4 transition-all duration-150",
          $claimFilter.has(s.key)
            ? "active border-(--c) bg-surface-selected"
            : "border-edge"
        ]}
        style="--c: {s.color}"
        onclick={() =>
          claimFilter.set(
            $claimFilter.has(s.key) ? new Set() : new Set([s.key])
          )}
        title="Filtrer : {s.label}">
        <!-- rec 04: SVG icon replaces emoji in stat tiles -->
        <StatusIcon status={s.key} size={22} />
        <span
          class="text-[1.75rem] leading-none font-bold"
          style="color: {s.color}">{$claimStats[s.key]}</span>
        <span class="text-3 tracking-wider text-fg-muted uppercase"
          >{s.label}</span>
      </button>
    {/each}
  </div>

  <div
    class="grid grid-cols-[1fr_2fr] items-start gap-6 max-[900px]:grid-cols-1">
    <div>
      <h3
        class="mt-0 mb-3 flex items-center gap-2 text-sm tracking-wider text-fg-muted uppercase">
        📝 Transcript
      </h3>
      <div
        class="flex max-h-120 flex-col gap-2 overflow-y-auto rounded-lg bg-surface-alt p-3">
        {#if $reversedTranscript.length === 0}
          <p class="m-0 p-8 text-center text-sm text-fg-faint">En attente...</p>
        {:else}
          {#each $reversedTranscript as entry (entry.timestamp)}
            <div
              class="flex flex-col gap-0.5 border-b border-surface pb-2 last:border-b-0 last:pb-0">
              <span class="text-3 tabular-nums text-fg-faint"
                >{formatTime(entry.timestamp)}</span>
              <span class="text-sm leading-snug text-fg-muted"
                >{entry.text}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div>
      <div class="mb-3 flex items-center gap-2">
        <h3
          class="m-0 flex items-center gap-2 text-sm tracking-wider text-fg-muted uppercase">
          Faits
          {#if $claimFilter.size > 0}<span
              class="rounded-sm border border-accent-dim bg-surface-selected px-1.5 py-0.5 text-3 text-fg-muted normal-case"
              >{[...$claimFilter]
                .map((s) => STATUS_META[s].filterLabel)
                .join(", ")}</span
            >{/if}
          <span class="text-sm text-fg-faint">({$filteredClaims.length})</span>
        </h3>
        <span class="ml-auto">
          <ClaimFiltersPopover showStatus={false} />
        </span>
      </div>
      <div class="flex max-h-120 flex-col gap-2 overflow-y-auto">
        {#each $filteredClaims as claim (claim.id)}
          <ClaimCard {claim} />
        {/each}
        {#if $filteredClaims.length === 0}
          <p class="m-0 p-8 text-center text-sm text-fg-faint">
            Aucun fait détecté...
          </p>
        {/if}
      </div>
    </div>
  </div>
</div>

<style>
  /* Top accent bar — a pseudo-element can't be expressed as a utility.
     --c is injected per-tile; .active mirrors the JS-driven selected state. */
  .stat-tile::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: var(--c);
    opacity: 0.4;
    transition: opacity 0.15s;
  }

  .stat-tile:hover::before,
  .stat-tile.active::before {
    opacity: 1;
  }
</style>
