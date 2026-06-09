<script lang="ts">
  import { STATUS_COLOR, STATUS_ICON, STATUS_LABEL } from "$lib/constants/status";
  import type { Claim } from "$lib/stores/claims";
  import { claims } from "$lib/stores/claims";

  let selectedClaim = $state<Claim | null>(null);

  let sorted = $derived([...$claims].sort((a, b) => a.timestamp - b.timestamp));

  // Time range for axis
  let minTs = $derived(sorted.length > 0 ? sorted[0].timestamp : 0);
  let maxTs = $derived(sorted.length > 0 ? sorted[sorted.length - 1].timestamp : 0);
  let range = $derived(maxTs - minTs || 1);

  function xPct(ts: number): number {
    if (sorted.length <= 1) return 50;
    return ((ts - minTs) / range) * 90 + 5; // 5%..95% margins
  }

  // Stagger overlapping dots vertically
  function yForIndex(i: number): number {
    return 50 + (i % 3 === 0 ? 0 : i % 3 === 1 ? -18 : 18);
  }

  function selectClaim(c: Claim) {
    selectedClaim = selectedClaim?.id === c.id ? null : c;
  }
</script>

<div class="flex flex-col gap-4">
  <h2 class="m-0 text-lg">⏱ Timeline des claims</h2>

  {#if sorted.length === 0}
    <div class="p-12 text-center text-zinc-600">
      <p>Aucun claim détecté pour le moment...</p>
      <p class="mt-2 text-sm">Les claims apparaîtront ici au fil de la conversation.</p>
    </div>
  {:else}
    <!-- Selected claim detail -->
    <div
      class={[
        "min-h-20 transition-opacity duration-200",
        selectedClaim !== null ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      ]}>
      {#if selectedClaim}
        <div
          class="rounded-lg border-l-4 bg-surface px-4 py-3 border-l-(--color)"
          style="--color: {STATUS_COLOR[selectedClaim.status]}">
          <div class="mb-1.5 flex items-center gap-2">
            <span class="text-base">{STATUS_ICON[selectedClaim.status]}</span>
            <span
              class="text-sm font-semibold tracking-wider uppercase"
              style="color: {STATUS_COLOR[selectedClaim.status]}">
              {STATUS_LABEL[selectedClaim.status]}
            </span>
            <span class="ml-auto text-sm tabular-nums text-zinc-600"
              >{new Date(selectedClaim.timestamp).toLocaleTimeString()}</span>
            <button
              class="cursor-pointer p-0 text-sm leading-none text-zinc-600 hover:text-zinc-400"
              onclick={() => (selectedClaim = null)}>✕</button>
          </div>
          <p class="mt-0 mb-1 text-sm text-fg italic">« {selectedClaim.text} »</p>
          {#if selectedClaim.explanation}
            <p class="m-0 text-sm leading-normal text-zinc-500">
              {selectedClaim.explanation}
            </p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- SVG timeline -->
    <div class="overflow-x-auto rounded-xl bg-surface-alt p-2">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="hidden">
        <!-- Horizontal axis line -->
        <line
          x1="5"
          y1="50"
          x2="95"
          y2="50"
          stroke="var(--color-surface-selected)"
          stroke-width="0.5" />
      </svg>

      <svg viewBox="0 0 100 100" class="block h-30 w-full">
        <!-- Axis line -->
        <line
          x1="5"
          y1="50"
          x2="95"
          y2="50"
          stroke="var(--color-surface-selected)"
          stroke-width="0.8" />

        <!-- Vertical tick for each claim -->
        {#each sorted as c, i (c.id)}
          {@const x = xPct(c.timestamp)}
          {@const y = yForIndex(i)}
          <!-- Connector line from dot to axis -->
          <line
            x1={x}
            y1={y}
            x2={x}
            y2="50"
            stroke={STATUS_COLOR[c.status]}
            stroke-width="0.5"
            stroke-dasharray="1 1"
            opacity="0.5" />
          <!-- Dot -->
          <circle
            cx={x}
            cy={y}
            r="4"
            fill={STATUS_COLOR[c.status]}
            stroke={selectedClaim?.id === c.id ? "#fff" : "transparent"}
            stroke-width="1.5"
            class="dot"
            role="button"
            tabindex="0"
            aria-label={c.text}
            onclick={() => selectClaim(c)}
            onkeydown={(e) => e.key === "Enter" && selectClaim(c)} />
        {/each}

        <!-- Time labels -->
        {#if sorted.length >= 2}
          <text x="5" y="62" font-size="4" fill="#555" text-anchor="middle">
            {new Date(minTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </text>
          <text x="95" y="62" font-size="4" fill="#555" text-anchor="middle">
            {new Date(maxTs).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </text>
        {/if}
      </svg>
    </div>

    <!-- Hint -->
    <p class="-mt-2 text-center text-sm text-zinc-700">
      Cliquez sur un point pour voir les détails.
    </p>

    <!-- Compact list below -->
    <div class="flex max-h-100 flex-col gap-1.5 overflow-y-auto">
      {#each sorted.reverse() as c (c.id)}
        <button
          class={[
            "flex w-full cursor-pointer items-start gap-2 rounded-md border border-l-[3px] border-edge bg-surface px-3 py-2 text-left transition-[background] duration-150 border-l-(--color)",
            selectedClaim?.id === c.id ? "bg-surface-raised" : "hover:bg-surface-raised"
          ]}
          style="--color: {STATUS_COLOR[c.status]}"
          onclick={() => selectClaim(c)}>
          <span class="mt-px shrink-0 text-sm">{STATUS_ICON[c.status]}</span>
          <span class="flex-1 text-sm leading-snug text-zinc-300">{c.text}</span>
          <span class="mt-0.5 shrink-0 text-xs tabular-nums text-zinc-600"
            >{new Date(c.timestamp).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit"
            })}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* SVG dot: the hover grows the radius via the geometry property `r`,
     which has no utility equivalent. */
  .dot {
    cursor: pointer;
    transition:
      r 0.15s,
      opacity 0.15s;
  }

  .dot:hover {
    r: 5.5;
  }
</style>
