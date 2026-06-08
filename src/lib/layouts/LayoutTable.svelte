<script lang="ts">
  import { claimFilter, filteredClaims, type ClaimFilter } from "$lib/stores/claims";

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: "En cours", color: "#f59e0b", icon: "⏳" },
    verified: { label: "Vérifié", color: "#10b981", icon: "✅" },
    false: { label: "Faux", color: "#ef4444", icon: "❌" },
    uncertain: { label: "Incertain", color: "#6b7280", icon: "❓" },
    unverifiable: { label: "Invérifiable", color: "#8b5cf6", icon: "🔍" }
  };

  const filters: { key: ClaimFilter; label: string; icon: string }[] = [
    { key: "all", label: "Tous", icon: "📋" },
    { key: "verified", label: "Vrais", icon: "✅" },
    { key: "false", label: "Faux", icon: "❌" },
    { key: "pending", label: "En cours", icon: "⏳" },
    { key: "uncertain", label: "Incertains", icon: "❓" },
    { key: "unverifiable", label: "Invérifiables", icon: "🔍" }
  ];

  let expandedId = $state<string | null>(null);
</script>

<div class="flex flex-col gap-3">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex flex-wrap gap-[0.4rem]">
      {#each filters as f}
        <button
          class={[
            "cursor-pointer rounded-[20px] border px-3 py-[0.3rem] text-[0.8rem] transition-all duration-150",
            $claimFilter === f.key
              ? "border-accent-700 bg-ink-700 text-white"
              : "border-ink-720 bg-ink-820 text-ash-500 hover:border-ash-700 hover:text-ash-300"
          ]}
          onclick={() => claimFilter.set(f.key)}>
          {f.icon}
          {f.label}
        </button>
      {/each}
    </div>
    <span class="text-[0.85rem] whitespace-nowrap text-ash-700"
      >{$filteredClaims.length} fait{$filteredClaims.length !== 1 ? "s" : ""}</span>
  </div>

  <div class="max-h-[calc(100vh-240px)] overflow-auto rounded-lg border border-ink-820">
    <table class="w-full border-collapse text-sm">
      <thead class="sticky top-0 z-[1]">
        <tr>
          <th
            class="w-20 border-b border-ink-720 bg-ink-820 px-[0.9rem] py-[0.6rem] text-left text-xs font-semibold tracking-wider text-ash-650 uppercase"
            >Heure</th>
          <th
            class="w-[130px] border-b border-ink-720 bg-ink-820 px-[0.9rem] py-[0.6rem] text-left text-xs font-semibold tracking-wider text-ash-650 uppercase"
            >Statut</th>
          <th
            class="min-w-[200px] border-b border-ink-720 bg-ink-820 px-[0.9rem] py-[0.6rem] text-left text-xs font-semibold tracking-wider text-ash-650 uppercase"
            >Affirmation</th>
          <th
            class="min-w-45 border-b border-ink-720 bg-ink-820 px-[0.9rem] py-[0.6rem] text-left text-xs font-semibold tracking-wider text-ash-650 uppercase"
            >Explication</th>
        </tr>
      </thead>
      <tbody>
        {#if $filteredClaims.length === 0}
          <tr>
            <td colspan="4" class="p-12 text-center text-ash-750"
              >Aucun fait détecté pour le moment...</td>
          </tr>
        {:else}
          {#each $filteredClaims as claim (claim.id)}
            {@const cfg = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.pending}
            <tr
              class="claim-row cursor-pointer border-b border-ink-850"
              class:expanded={expandedId === claim.id}
              style="--sc: {cfg.color}"
              onclick={() => (expandedId = expandedId === claim.id ? null : claim.id)}>
              <td
                class="w-20 px-[0.9rem] py-[0.65rem] align-top text-[0.78rem] whitespace-nowrap tabular-nums text-ash-700"
                >{new Date(claim.timestamp).toLocaleTimeString()}</td>
              <td class="w-[130px] px-[0.9rem] py-[0.65rem] align-top whitespace-nowrap">
                <span class="text-[0.8rem] font-medium" style="color: {cfg.color}">
                  {cfg.icon}
                  {cfg.label}
                </span>
              </td>
              <td class="min-w-[200px] px-[0.9rem] py-[0.65rem] align-top">
                <span
                  class={[
                    "leading-[1.4] text-ash-400 italic",
                    expandedId !== claim.id && "line-clamp-2"
                  ]}>
                  {claim.text}
                </span>
              </td>
              <td class="min-w-45 px-[0.9rem] py-[0.65rem] align-top">
                {#if claim.explanation}
                  <span
                    class={[
                      "text-[0.82rem] leading-[1.4] text-[#777]",
                      expandedId !== claim.id && "line-clamp-2"
                    ]}>
                    {claim.explanation}
                  </span>
                {:else if claim.status === "pending"}
                  <span class="text-[0.78rem] text-ash-750 italic">analyse...</span>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  /* Row left-accent on hover/expanded uses the JS-injected --sc; the hover
     state and the expanded class interplay are clearest kept in CSS. */
  .claim-row {
    border-left: 3px solid transparent;
    transition:
      background 0.1s,
      border-color 0.1s;
  }

  .claim-row:hover {
    background: #1c1c2c;
    border-left-color: var(--sc);
  }

  .claim-row.expanded {
    background: #1e1e2e;
    border-left-color: var(--sc);
  }
</style>
