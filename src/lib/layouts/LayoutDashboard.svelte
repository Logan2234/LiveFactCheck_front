<script lang="ts">
  import ClaimCard from "$lib/components/ClaimCard.svelte";
  import { transcriptEntries } from "$lib/stores/audio";
  import { claimFilter, claimStats, filteredClaims, type ClaimFilter } from "$lib/stores/claims";

  const statCards: { key: keyof typeof $claimStats; label: string; icon: string; color: string }[] =
    [
      { key: "verified", label: "Vrais", icon: "✅", color: "#10b981" },
      { key: "false", label: "Faux", icon: "❌", color: "#ef4444" },
      { key: "pending", label: "En cours", icon: "⏳", color: "#f59e0b" },
      { key: "uncertain", label: "Incertains", icon: "❓", color: "#6b7280" },
      { key: "unverifiable", label: "Invérifiables", icon: "🔍", color: "#8b5cf6" }
    ];
</script>

<div class="flex flex-col gap-5">
  <div class="grid grid-cols-5 gap-3 max-[900px]:grid-cols-3">
    {#each statCards as s}
      <button
        class={[
          "stat-tile relative flex cursor-pointer flex-col items-center gap-1 overflow-hidden rounded-xl border bg-surface px-3 py-4 transition-all duration-150",
          $claimFilter === s.key ? "active border-(--c) bg-[#222235]" : "border-edge"
        ]}
        style="--c: {s.color}"
        onclick={() => claimFilter.set($claimFilter === s.key ? "all" : (s.key as ClaimFilter))}
        title="Filtrer : {s.label}">
        <span class="text-xl">{s.icon}</span>
        <span class="text-[1.75rem] leading-none font-bold" style="color: {s.color}"
          >{$claimStats[s.key]}</span>
        <span class="text-3 tracking-wider text-zinc-500 uppercase">{s.label}</span>
      </button>
    {/each}
  </div>

  <div class="grid grid-cols-[1fr_2fr] items-start gap-6 max-[900px]:grid-cols-1">
    <div>
      <h3
        class="mt-0 mb-3 flex items-center gap-2 text-sm tracking-wider text-zinc-500 uppercase">
        📝 Transcript
      </h3>
      <div class="flex max-h-120 flex-col gap-2 overflow-y-auto rounded-lg bg-surface-alt p-3">
        {#if $transcriptEntries.length === 0}
          <p class="m-0 p-8 text-center text-sm text-zinc-700">En attente...</p>
        {:else}
          {#each [...$transcriptEntries].reverse() as entry (entry.timestamp)}
            <div
              class="flex flex-col gap-0.5 border-b border-surface pb-2 last:border-b-0 last:pb-0">
              <span class="text-3 tabular-nums text-zinc-700"
                >{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <span class="text-sm leading-snug text-zinc-500">{entry.text}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>

    <div>
      <h3
        class="mt-0 mb-3 flex items-center gap-2 text-sm tracking-wider text-zinc-500 uppercase">
        Faits
        {#if $claimFilter !== "all"}<span
            class="rounded-sm border border-accent-dim bg-surface-selected px-1.5 py-0.5 text-3 text-zinc-400 normal-case"
            >{$claimFilter}</span
          >{/if}
        <span class="text-sm text-zinc-600">({$filteredClaims.length})</span>
      </h3>
      <div class="flex max-h-120 flex-col gap-2 overflow-y-auto">
        {#each $filteredClaims as claim (claim.id)}
          <ClaimCard {claim} />
        {/each}
        {#if $filteredClaims.length === 0}
          <p class="m-0 p-8 text-center text-sm text-zinc-700">Aucun fait détecté...</p>
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
