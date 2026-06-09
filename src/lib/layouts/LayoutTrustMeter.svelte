<script lang="ts">
  import { STATUS_COLOR, STATUS_LABEL } from "$lib/constants/status";
  import { claimStats, sortedClaims } from "$lib/stores/claims";

  const R = 80;
  const C = 2 * Math.PI * R;
  const CX = 100;
  const CY = 100;

  // Only count finalized claims for the trust %
  let finalized = $derived(
    $claimStats.verified + $claimStats.false + $claimStats.uncertain + $claimStats.unverifiable
  );
  let trustPct = $derived(
    finalized === 0 ? 0 : Math.round(($claimStats.verified / finalized) * 100)
  );

  let gaugeColor = $derived(trustPct >= 70 ? "#10b981" : trustPct >= 40 ? "#f59e0b" : "#ef4444");

  // Donut segments for all statuses (excluding pending)
  type Segment = {
    key: string;
    count: number;
    color: string;
    dasharray: string;
    dashoffset: number;
  };

  let segments = $derived<Segment[]>(
    (() => {
      const total = $claimStats.total;
      if (total === 0) return [];
      const items = [
        { key: "verified", count: $claimStats.verified, color: STATUS_COLOR.verified },
        { key: "false", count: $claimStats.false, color: STATUS_COLOR.false },
        { key: "uncertain", count: $claimStats.uncertain, color: STATUS_COLOR.uncertain },
        { key: "unverifiable", count: $claimStats.unverifiable, color: STATUS_COLOR.unverifiable },
        { key: "pending", count: $claimStats.pending, color: STATUS_COLOR.pending }
      ].filter((s) => s.count > 0);

      let offset = 0;
      return items.map((s) => {
        const dash = (s.count / total) * C;
        const seg: Segment = {
          ...s,
          dasharray: `${dash} ${C - dash}`,
          dashoffset: -offset
        };
        offset += dash;
        return seg;
      });
    })()
  );
</script>

<div class="grid grid-cols-[300px_1fr] items-start gap-8 max-[800px]:grid-cols-1">
  <div class="sticky top-4 rounded-xl bg-surface-alt p-6 max-[800px]:static">
    <h2 class="mt-0 mb-4 text-lg">🎯 Trust Meter</h2>

    <div class="mb-5 flex justify-center">
      <svg viewBox="0 0 200 200" class="h-45 w-45">
        <!-- Track -->
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--color-edge)" stroke-width="20" />

        {#if segments.length > 0}
          <!-- Segments (rotate -90° so we start at 12 o'clock) -->
          <g transform="rotate(-90 100 100)">
            {#each segments as seg (seg.key)}
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={seg.color}
                stroke-width="20"
                stroke-dasharray={seg.dasharray}
                stroke-dashoffset={seg.dashoffset} />
            {/each}
          </g>
        {/if}

        <!-- Center text -->
        <text
          x="100"
          y="92"
          text-anchor="middle"
          class="text-[2rem] font-bold tabular-nums"
          fill={gaugeColor}>
          {trustPct}%
        </text>
        <text x="100" y="112" text-anchor="middle" class="text-sm" fill="#888"> vérifié </text>
        <text x="100" y="130" text-anchor="middle" class="text-xs" fill="#555">
          {finalized} claim{finalized !== 1 ? "s" : ""}
        </text>
      </svg>
    </div>

    <!-- Legend -->
    <div class="mb-4 flex flex-col gap-2">
      {#each Object.entries(STATUS_COLOR).filter(([k]) => k !== "pending") as [key, color]}
        {@const count = ($claimStats as Record<string, number>)[key] ?? 0}
        <div class="flex items-center gap-2 text-sm">
          <span class="h-2.5 w-2.5 shrink-0 rounded-full" style="background: {color}"></span>
          <span class="flex-1 text-zinc-400">{STATUS_LABEL[key]}</span>
          <span class="font-semibold tabular-nums" style="color: {color}">{count}</span>
        </div>
      {/each}
    </div>

    <!-- Overall totals -->
    <div class="flex flex-col gap-1.5 border-t border-edge pt-3">
      <div class="flex justify-between text-sm text-zinc-500">
        <span>Total analysés</span>
        <strong class="text-zinc-200">{$claimStats.total}</strong>
      </div>
      <div class="flex justify-between text-sm text-zinc-500">
        <span>En attente</span>
        <strong class="text-amber-500">{$claimStats.pending}</strong>
      </div>
    </div>
  </div>

  <div class="min-w-0">
    <h2 class="mt-0 mb-4 text-lg">Derniers claims</h2>
    <div class="flex max-h-150 flex-col gap-2 overflow-y-auto">
      {#each $sortedClaims as c (c.id)}
        <div
          class="rounded-lg border-l-4 bg-surface px-4 py-3 border-l-(--color)"
          style="--color: {STATUS_COLOR[c.status]}">
          <div class="mb-1.5 flex items-center gap-2">
            <span class="h-2 w-2 rounded-full" style="background: {STATUS_COLOR[c.status]}"></span>
            <span
              class="text-sm font-semibold tracking-wide uppercase"
              style="color: {STATUS_COLOR[c.status]}">{STATUS_LABEL[c.status]}</span>
          </div>
          <p class="mt-0 mb-1 text-sm text-fg italic">« {c.text} »</p>
          {#if c.explanation}
            <p class="m-0 text-sm leading-snug text-zinc-500">{c.explanation}</p>
          {/if}
        </div>
      {:else}
        <p class="m-0 p-8 text-center text-zinc-600">Aucun claim détecté...</p>
      {/each}
    </div>
  </div>
</div>
