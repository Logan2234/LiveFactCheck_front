<script lang="ts">
  import { claims, sortedClaims } from "$lib/stores/claims";

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: "Analyse en cours...", color: "#f59e0b", icon: "⏳" },
    verified: { label: "Vérifié", color: "#10b981", icon: "✅" },
    false: { label: "Faux", color: "#ef4444", icon: "❌" },
    uncertain: { label: "Incertain", color: "#6b7280", icon: "❓" },
    unverifiable: { label: "Non vérifiable", color: "#8b5cf6", icon: "🔍" }
  };

  // Most recent claim
  const spotlight = $derived($claims.length > 0 ? $claims[$claims.length - 1] : null);

  const strip = $sortedClaims;

  let selectedId = $state<string | null>(null);

  // Shown claim: selected from strip, or default to most recent
  const shown = $derived(
    (() => {
      if (selectedId) {
        const found = $claims.find((c) => c.id === selectedId);
        if (found) return found;
      }
      return $claims.length > 0 ? $claims[$claims.length - 1] : null;
    })()
  );
</script>

<div class="flex flex-col gap-6">
  {#if shown}
    {@const cfg = STATUS_CONFIG[shown.status] ?? STATUS_CONFIG.pending}
    <div
      class="flex min-h-70 flex-col items-center justify-center gap-5 rounded-xl border border-t-4 border-edge bg-surface-alt px-16 py-12 text-center transition-[border-color] duration-300 border-t-(--sc)"
      style="--sc: {cfg.color}">
      <div class="flex items-center gap-[0.6rem]">
        <span class="text-[2rem]">{cfg.icon}</span>
        <span class="text-[1.4rem] font-bold tracking-widest uppercase" style="color: {cfg.color}"
          >{cfg.label}</span>
      </div>
      <blockquote class="m-0 max-w-170 text-[1.35rem] leading-normal text-fg italic">
        « {shown.text} »
      </blockquote>
      {#if shown.explanation}
        <p class="m-0 max-w-150 text-base leading-[1.6] text-zinc-500">{shown.explanation}</p>
      {/if}
      <span class="text-[0.8rem] tabular-nums text-zinc-700"
        >{new Date(shown.timestamp).toLocaleTimeString()}</span>
    </div>
  {:else}
    <div
      class="flex min-h-70 flex-col items-center justify-center gap-5 rounded-xl border border-t-4 border-edge bg-surface-alt px-16 py-12 text-center transition-[border-color] duration-300 border-t-(--sc)"
      style="--sc: #333">
      <p class="m-0 text-[1.1rem] text-zinc-700">En attente d'un fait à vérifier...</p>
    </div>
  {/if}

  {#if strip.length > 0}
    <div class="flex gap-2 overflow-x-auto pb-1">
      {#each strip as claim (claim.id)}
        {@const cfg = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.pending}
        <button
          class={[
            "flex shrink-0 cursor-pointer items-center gap-[0.4rem] rounded-[20px] border bg-surface px-3 py-[0.3rem] whitespace-nowrap transition-all duration-150",
            selectedId === claim.id || (!selectedId && claim.id === spotlight?.id)
              ? "border-(--sc) bg-[#222235]"
              : "border-edge hover:border-(--sc)"
          ]}
          style="--sc: {cfg.color}"
          onclick={() => (selectedId = claim.id === selectedId ? null : claim.id)}
          title={claim.text}>
          <span class="text-[0.85rem]">{cfg.icon}</span>
          <span class="text-[0.78rem] text-zinc-400"
            >{claim.text.slice(0, 40)}{claim.text.length > 40 ? "…" : ""}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
