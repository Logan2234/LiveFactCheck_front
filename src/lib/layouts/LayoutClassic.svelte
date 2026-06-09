<script lang="ts">
  import ClaimCard from "$lib/components/ClaimCard.svelte";
  import { transcriptEntries } from "$lib/stores/audio";
  import { claimFilter, claimStats, filteredClaims, type ClaimFilter } from "$lib/stores/claims";

  const filters: { key: ClaimFilter; label: string; icon: string }[] = [
    { key: "all", label: "Tous", icon: "📋" },
    { key: "verified", label: "Vrais", icon: "✅" },
    { key: "false", label: "Faux", icon: "❌" },
    { key: "pending", label: "En cours", icon: "⏳" },
    { key: "uncertain", label: "Incertains", icon: "❓" },
    { key: "unverifiable", label: "Invérifiables", icon: "🔍" }
  ];
</script>

<div class="grid grid-cols-1 items-start gap-8 md:grid-cols-2">
  <section>
    <h2 class="mt-0 mb-3 text-lg">📝 Transcription</h2>
    <div class="flex max-h-115 flex-col gap-1.5 overflow-y-auto rounded-lg bg-surface p-3">
      {#if $transcriptEntries.length === 0}
        <p class="m-0 p-8 text-center text-zinc-600">En attente de la transcription...</p>
      {:else}
        {#each [...$transcriptEntries].reverse() as entry (entry.timestamp)}
          <div class="flex items-baseline gap-3 rounded-md bg-surface-raised px-2 py-1.5">
            <span class="shrink-0 text-xs whitespace-nowrap tabular-nums text-zinc-600"
              >{new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span class="text-sm leading-normal text-zinc-300">{entry.text}</span>
          </div>
        {/each}
      {/if}
    </div>
  </section>

  <section>
    <div class="mb-2">
      <h2 class="mt-0 mb-3 text-lg">📊 Claims ({$claimStats.total})</h2>
      <div class="mt-1.5 flex flex-wrap gap-3 text-sm">
        <span class="text-emerald-500">✅ {$claimStats.verified}</span>
        <span class="text-red-500">❌ {$claimStats.false}</span>
        <span class="text-amber-500">⏳ {$claimStats.pending}</span>
        <span class="text-gray-500">❓ {$claimStats.uncertain}</span>
        <span class="text-violet-500">🔍 {$claimStats.unverifiable}</span>
      </div>
    </div>
    <div class="mb-3 flex flex-wrap gap-1.5">
      {#each filters as { key, label, icon } (key)}
        <button
          class={[
            "cursor-pointer rounded-[20px] border px-3 py-1.5 text-sm transition-all duration-150",
            $claimFilter === key
              ? "border-accent-dim bg-surface-selected text-white"
              : "border-edge bg-surface text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
          ]}
          onclick={() => claimFilter.set(key)}>
          {icon}
          {label}
        </button>
      {/each}
    </div>
    <div class="flex max-h-115 flex-col gap-2 overflow-y-auto">
      {#each $filteredClaims as claim (claim.id)}
        <ClaimCard {claim} />
      {/each}
      {#if $filteredClaims.length === 0}
        <p class="m-0 p-8 text-center text-zinc-600">Aucun fait détecté pour le moment...</p>
      {/if}
    </div>
  </section>
</div>
