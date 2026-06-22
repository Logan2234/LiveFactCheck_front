<script lang="ts">
  import StatusIcon from "$lib/components/ui/StatusIcon.svelte";
  import {
    STATUS_COLOR,
    STATUS_LABEL,
    STATUS_ORDER
  } from "$lib/constants/status";
  import { claimStats, sortedClaims } from "$lib/stores/claims";

  const R = 80;
  const C = 2 * Math.PI * R;
  const CX = 100;
  const CY = 100;

  let finalized = $derived(
    $claimStats.verified +
      $claimStats.false +
      $claimStats.uncertain +
      $claimStats.unverifiable
  );
  let trustPct = $derived(
    finalized === 0 ? 0 : Math.round(($claimStats.verified / finalized) * 100)
  );

  let gaugeColor = $derived(
    trustPct >= 70 ? "#10b981" : trustPct >= 40 ? "#f59e0b" : "#ef4444"
  );

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
        {
          key: "verified",
          count: $claimStats.verified,
          color: STATUS_COLOR.verified
        },
        { key: "false", count: $claimStats.false, color: STATUS_COLOR.false },
        {
          key: "uncertain",
          count: $claimStats.uncertain,
          color: STATUS_COLOR.uncertain
        },
        {
          key: "unverifiable",
          count: $claimStats.unverifiable,
          color: STATUS_COLOR.unverifiable
        },
        {
          key: "pending",
          count: $claimStats.pending,
          color: STATUS_COLOR.pending
        }
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

<div
  class="grid grid-cols-[300px_1fr] items-start gap-8 max-[800px]:grid-cols-1">
  <div class="sticky top-4 rounded-xl bg-surface-alt p-6 max-[800px]:static">
    <h2
      class="mt-0 mb-4 font-display text-xl font-extrabold uppercase tracking-wide">
      Trust Meter
    </h2>

    <div class="mb-5 flex justify-center">
      <svg viewBox="0 0 200 200" class="h-45 w-45">
        <!-- Track -->
        <circle
          cx={CX}
          cy={CY}
          r={R}
          fill="none"
          stroke="var(--color-edge)"
          stroke-width="20" />

        {#if segments.length > 0}
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

        <!--
          rec E: Barlow Condensed via font-family attribute on SVG text.
          SVG text inherits CSS but font-family must be explicit here.
        -->
        <text
          x="100"
          y="96"
          text-anchor="middle"
          font-family="'Barlow Condensed', sans-serif"
          font-weight="800"
          font-size="34"
          fill={gaugeColor}>
          {trustPct}%
        </text>
        <text
          x="100"
          y="115"
          text-anchor="middle"
          font-family="'Barlow Condensed', sans-serif"
          font-weight="700"
          font-size="11"
          letter-spacing="1"
          fill="var(--color-fg-muted)">
          VÉRIFIÉ
        </text>
        <text
          x="100"
          y="132"
          text-anchor="middle"
          font-size="11"
          fill="var(--color-fg-faint)">
          {finalized} claim{finalized !== 1 ? "s" : ""}
        </text>
      </svg>
    </div>

    <!-- Legend with StatusIcon -->
    <div class="mb-4 flex flex-col gap-2">
      {#each STATUS_ORDER.filter((s) => s !== "pending") as key (key)}
        <div class="flex items-center gap-2 text-sm">
          <StatusIcon status={key} size={13} />
          <span class="flex-1 text-fg-muted">{STATUS_LABEL[key]}</span>
          <span
            class="font-semibold tabular-nums"
            style="color: {STATUS_COLOR[key]}">{$claimStats[key]}</span>
        </div>
      {/each}
    </div>

    <div class="flex flex-col gap-1.5 border-t border-edge pt-3">
      <div class="flex justify-between text-sm text-fg-muted">
        <span>Total analysés</span>
        <strong class="text-fg">{$claimStats.total}</strong>
      </div>
      <div class="flex justify-between text-sm text-fg-muted">
        <span>En attente</span>
        <strong class="text-amber-500">{$claimStats.pending}</strong>
      </div>
    </div>
  </div>

  <div class="min-w-0">
    <h2 class="mt-0 mb-4 text-lg">Derniers claims</h2>
    <!-- rec E: confidence fill instead of border-l-4, matching ClaimCard -->
    <div class="flex max-h-150 flex-col gap-2 overflow-y-auto">
      {#each $sortedClaims as c (c.id)}
        {@const fillPct = c.status === "pending" ? 0 : c.confidence * 10}
        <div
          class="rounded-lg border-l-[3px] px-4 py-3"
          style="border-left-color: {STATUS_COLOR[
            c.status
          ]}; background: linear-gradient(to right, color-mix(in srgb, {STATUS_COLOR[
            c.status
          ]} 11%, var(--color-surface)) {fillPct}%, var(--color-surface) {fillPct}%);">
          <div class="mb-1.5 flex items-center gap-2">
            <StatusIcon status={c.status} size={13} />
            <span
              class="font-display text-sm font-extrabold tracking-wide uppercase"
              style="color: {STATUS_COLOR[c.status]}"
              >{STATUS_LABEL[c.status]}</span>
          </div>
          <p class="mt-0 mb-1 text-sm text-fg italic">« {c.text} »</p>
          {#if c.explanation}
            <p class="m-0 text-sm leading-snug text-fg-muted">
              {c.explanation}
            </p>
          {/if}
        </div>
      {:else}
        <p class="m-0 p-8 text-center text-fg-faint">Aucun claim détecté...</p>
      {/each}
    </div>
  </div>
</div>
