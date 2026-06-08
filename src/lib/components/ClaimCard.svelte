<script lang="ts">
  import type { Claim } from "$lib/stores/claims";

  let { claim }: { claim: Claim } = $props();

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: "En cours...", color: "#f59e0b", icon: "⏳" },
    verified: { label: "Vérifié", color: "#10b981", icon: "✅" },
    false: { label: "Faux", color: "#ef4444", icon: "❌" },
    uncertain: { label: "Incertain", color: "#6b7280", icon: "❓" },
    unverifiable: { label: "Non vérifiable", color: "#8b5cf6", icon: "🔍" }
  };

  const categoryColors: Record<string, string> = {
    politique: "#3b82f6",
    économie: "#f59e0b",
    science: "#06b6d4",
    santé: "#10b981",
    histoire: "#8b5cf6",
    sport: "#f97316",
    société: "#ec4899",
    technologie: "#6366f1",
    autre: "#6b7280"
  };

  let config = $derived(statusConfig[claim.status] || statusConfig.pending);
  let catColor = $derived(categoryColors[claim.category] || categoryColors.autre);

  let copied = $state(false);

  function copy() {
    const lines = [
      `${config.icon} ${config.label} — ${claim.text}`,
      claim.explanation ? `→ ${claim.explanation}` : "",
      claim.counter_claim ? `✔ Réalité : ${claim.counter_claim}` : "",
      claim.sources.length ? `Sources : ${claim.sources.join(", ")}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 1500);
    });
  }
</script>

<div
  class="mb-3 rounded-lg border-l-4 bg-ink-820 px-4 py-[0.85rem]"
  style="border-left-color: {config.color}">
  <div class="mb-2 flex flex-wrap items-center gap-[0.4rem]">
    <span>{config.icon}</span>
    <span class="text-[0.85rem] font-semibold" style="color: {config.color}">{config.label}</span>

    {#if claim.category && claim.status !== "pending"}
      <span
        class="rounded-full px-[0.55rem] py-[0.1rem] text-[0.72rem] font-medium tracking-[0.02em]"
        style="background: color-mix(in srgb, {catColor} 20%, transparent); border: 1px solid color-mix(in srgb, {catColor} 50%, transparent); color: {catColor}"
        >{claim.category}</span>
    {/if}

    {#if claim.status !== "pending"}
      <span
        class="cursor-help text-[0.78rem] leading-none opacity-[0.85]"
        title={claim.web_search_used
          ? "Vérifié avec une recherche web"
          : "Vérifié sans recherche web (connaissances internes)"}>
        {claim.web_search_used ? "🌐" : "🧠"}
      </span>
    {/if}

    {#if claim.confidence > 0 && claim.status !== "pending"}
      <span class="ml-[0.1rem] flex items-center gap-[0.3rem]" title="Score de confiance">
        <span
          class="inline-block h-1 max-w-12 min-w-1 rounded-xs opacity-80"
          style="width: {claim.confidence * 10}%; background: {config.color}"></span>
        <span class="text-[0.72rem] tabular-nums text-ash-650">{claim.confidence}/10</span>
      </span>
    {/if}

    <span class="ml-auto text-[0.78rem] whitespace-nowrap tabular-nums text-ash-600"
      >{new Date(claim.timestamp).toLocaleTimeString()}</span>

    <button
      class="shrink-0 rounded-sm border border-transparent bg-transparent px-[0.35rem] py-[0.1rem] text-[0.85rem] leading-none text-ash-700 transition-all duration-150 hover:border-ink-680 hover:text-ash-500"
      onclick={copy}
      title="Copier ce claim"
      aria-label="Copier">
      {copied ? "✓" : "⎘"}
    </button>
  </div>

  <p class="my-[0.2rem] text-[0.92rem] leading-normal text-fog-250 italic">« {claim.text} »</p>

  {#if claim.explanation}
    <p class="mt-[0.45rem] text-sm leading-normal text-ash-500">{claim.explanation}</p>
  {/if}

  {#if claim.counter_claim}
    <div
      class="mt-2 rounded-r-md border-l-[3px] border-emerald-500 bg-emerald-500/12 px-[0.65rem] py-[0.4rem] text-sm">
      <span class="mr-[0.35rem] font-semibold text-emerald-500">✔ Réalité :</span>
      <span class="text-ash-400">{claim.counter_claim}</span>
    </div>
  {/if}

  {#if claim.sources.length > 0}
    <div class="mt-2 flex flex-col gap-[0.15rem] text-[0.8rem]">
      <span class="text-ash-650">Sources :</span>
      {#each claim.sources as source}
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer"
          class="overflow-hidden text-ellipsis text-blue-400 no-underline hover:underline"
          >{source}</a>
      {/each}
    </div>
  {/if}
</div>
