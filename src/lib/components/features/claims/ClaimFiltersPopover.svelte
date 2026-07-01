<script lang="ts">
  import Icon from "$lib/components/ui/Icon.svelte";
  import Popover from "$lib/components/ui/Popover.svelte";
  import { CATEGORIES, CATEGORY_COLORS } from "$lib/constants/categories";
  import { CLAIM_FILTERS, STATUS_COLOR } from "$lib/constants/status";
  import {
    categoryFilter,
    claimFilter,
    minConfidence,
    toggleCategoryFilter,
    toggleStatusFilter
  } from "$lib/stores/claims";

  // Shared "Filtres" popover for both layouts. Dashboard already filters by
  // status via its big stat-tile cards, so it hides the status group here to
  // avoid offering the same filter twice through two different controls.
  let { showStatus = true }: { showStatus?: boolean } = $props();

  const activeFilters = $derived(
    (showStatus && $claimFilter.size > 0 ? 1 : 0) +
      ($categoryFilter.size > 0 ? 1 : 0) +
      ($minConfidence > 0 ? 1 : 0)
  );
</script>

<Popover label="Filtres" panelClass="w-72 p-3">
  {#snippet trigger({ toggle, open })}
    <button
      type="button"
      class={[
        "flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors",
        open || activeFilters > 0
          ? "border-accent-dim bg-surface-selected text-fg"
          : "border-edge bg-surface text-fg-muted hover:border-edge-hi hover:text-fg"
      ]}
      aria-haspopup="dialog"
      aria-expanded={open}
      onclick={toggle}>
      <Icon name="filter" size={14} />
      Filtres
      {#if activeFilters > 0}
        <span
          class="flex h-4 w-4 items-center justify-center rounded-full bg-accent text-2xs font-semibold text-white">
          {activeFilters}
        </span>
      {/if}
    </button>
  {/snippet}

  <div class="flex flex-col gap-3">
    {#if showStatus}
      <div>
        <p
          class="mb-1.5 text-2xs font-semibold tracking-wide text-fg-faint uppercase">
          Statut
        </p>
        <div class="flex flex-wrap gap-1.5">
          <button
            class={[
              "cursor-pointer rounded-[20px] border px-2.5 py-1 text-sm transition-all duration-150",
              $claimFilter.size === 0
                ? "border-accent-dim bg-surface-selected text-fg"
                : "border-edge bg-surface text-fg-muted hover:border-edge-hi hover:text-fg"
            ]}
            onclick={() => claimFilter.set(new Set())}>
            Tous
          </button>
          {#each CLAIM_FILTERS as { key, label } (key)}
            {@const color = STATUS_COLOR[key]}
            <button
              class={[
                "flex cursor-pointer items-center gap-1.5 rounded-[20px] border px-2.5 py-1 text-sm transition-all duration-150",
                $claimFilter.has(key)
                  ? "border-(--c) bg-surface-selected text-fg"
                  : "border-edge bg-surface text-fg-muted hover:border-edge-hi hover:text-fg"
              ]}
              style="--c: {color}"
              onclick={() => toggleStatusFilter(key)}>
              <span class="h-1.5 w-1.5 rounded-full" style="background: {color}"
              ></span>
              {label}
            </button>
          {/each}
        </div>
      </div>
    {/if}
    <div>
      <p
        class="mb-1.5 text-2xs font-semibold tracking-wide text-fg-faint uppercase">
        Catégorie
      </p>
      <div class="flex flex-wrap gap-1.5">
        <button
          class={[
            "cursor-pointer rounded-[20px] border px-2.5 py-1 text-sm transition-all duration-150",
            $categoryFilter.size === 0
              ? "border-accent-dim bg-surface-selected text-fg"
              : "border-edge bg-surface text-fg-muted hover:border-edge-hi hover:text-fg"
          ]}
          onclick={() => categoryFilter.set(new Set())}>
          Toutes
        </button>
        {#each CATEGORIES as cat (cat)}
          {@const color = CATEGORY_COLORS[cat]}
          <button
            class={[
              "flex cursor-pointer items-center gap-1.5 rounded-[20px] border px-2.5 py-1 text-sm capitalize transition-all duration-150",
              $categoryFilter.has(cat)
                ? "border-(--c) bg-surface-selected text-fg"
                : "border-edge bg-surface text-fg-muted hover:border-edge-hi hover:text-fg"
            ]}
            style="--c: {color}"
            onclick={() => toggleCategoryFilter(cat)}>
            <span class="h-1.5 w-1.5 rounded-full" style="background: {color}"
            ></span>
            {cat}
          </button>
        {/each}
      </div>
    </div>
    <div>
      <p
        class="mb-1.5 text-2xs font-semibold tracking-wide text-fg-faint uppercase">
        Score min.
      </p>
      <div class="flex items-center gap-2 text-sm text-fg-muted">
        <input
          class="theme-range"
          type="range"
          min="0"
          max="10"
          step="1"
          aria-label="Score de confiance minimum"
          value={$minConfidence}
          style="--fill: {$minConfidence * 10}%"
          oninput={(e) => minConfidence.set(Number(e.currentTarget.value))} />
        <span class="tabular-nums">{$minConfidence}/10</span>
      </div>
    </div>
  </div>
</Popover>
