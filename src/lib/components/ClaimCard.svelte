<script lang="ts">
  import { CATEGORY_COLORS } from "$lib/constants/categories";
  import { STATUS_COLOR, STATUS_ICON, STATUS_LABEL } from "$lib/constants/status";
  import type { Claim } from "$lib/stores/claims";
  import { formatTime } from "$lib/utils/format";

  let { claim }: { claim: Claim } = $props();

  let catColor = $derived(CATEGORY_COLORS[claim.category] || CATEGORY_COLORS.autre);

  let copied = $state(false);

  function copy() {
    const lines = [
      `${STATUS_ICON[claim.status]} ${STATUS_LABEL[claim.status]} — ${claim.text}`,
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
  class="mb-3 rounded-lg border-l-4 bg-surface px-4 py-3.5"
  style="border-left-color: {STATUS_COLOR[claim.status]}">
  <div class="mb-2 flex flex-wrap items-center gap-1.5">
    <span>{STATUS_ICON[claim.status]}</span>
    <span class="text-sm font-semibold" style="color: {STATUS_COLOR[claim.status]}">
      {STATUS_LABEL[claim.status]}
    </span>

    {#if claim.category && claim.status !== "pending"}
      <span
        class="rounded-full px-2 py-0.5 text-2xs font-medium tracking-wide"
        style="background: color-mix(in srgb, {catColor} 20%, transparent); border: 1px solid color-mix(in srgb, {catColor} 50%, transparent); color: {catColor}"
        >{claim.category}</span>
    {/if}

    {#if claim.status !== "pending"}
      <span
        class="cursor-help text-xs leading-none opacity-85"
        title={claim.web_search_used
          ? "Vérifié avec une recherche web"
          : "Vérifié sans recherche web (connaissances internes)"}>
        {claim.web_search_used ? "🌐" : "🧠"}
      </span>
    {/if}

    {#if claim.confidence > 0 && claim.status !== "pending"}
      <span class="ml-0.5 flex items-center gap-1.5" title="Score de confiance">
        <span
          class="inline-block h-1 max-w-12 min-w-1 rounded-xs opacity-80"
          style="width: {claim.confidence * 10}%; background: {STATUS_COLOR[claim.status]}"></span>
        <span class="text-2xs tabular-nums text-fg-faint">{claim.confidence}/10</span>
      </span>
    {/if}

    <span class="ml-auto text-xs whitespace-nowrap tabular-nums text-fg-muted"
      >{formatTime(claim.timestamp)}</span>

    <button
      class="shrink-0 rounded-sm border border-transparent bg-transparent px-1.5 py-0.5 text-sm leading-none text-fg-faint transition-all duration-150 hover:border-edge-hi hover:text-fg-muted"
      onclick={copy}
      title="Copier ce claim"
      aria-label="Copier">
      {copied ? "✓" : "⎘"}
    </button>
  </div>

  <p class="my-1 text-sm leading-normal text-fg italic">« {claim.text} »</p>

  {#if claim.explanation}
    <p class="mt-2 text-sm leading-normal text-fg-muted">{claim.explanation}</p>
  {/if}

  {#if claim.counter_claim}
    <div
      class="mt-2 rounded-r-md border-l-[3px] border-emerald-500 bg-emerald-500/12 px-2.5 py-1.5 text-sm">
      <span class="mr-1.5 font-semibold text-emerald-500">✔ Réalité :</span>
      <span class="text-fg">{claim.counter_claim}</span>
    </div>
  {/if}

  {#if claim.sources.length > 0}
    <div class="mt-2 flex flex-col gap-0.5 text-sm">
      <span class="text-fg-faint">Sources :</span>
      {#each claim.sources as source (source)}
        <a
          href={source}
          target="_blank"
          rel="noopener noreferrer external"
          class="overflow-hidden text-ellipsis text-blue-400 no-underline hover:underline"
          >{source}</a>
      {/each}
    </div>
  {/if}
</div>
