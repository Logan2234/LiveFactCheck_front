<script lang="ts">
  import { claims, claimStats, sortedClaims } from "$lib/stores/claims";
  import { STATUS_COLOR, STATUS_LABEL } from "$lib/constants/status";

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

<div class="trust-layout">
  <div class="gauge-section">
    <h2>🎯 Trust Meter</h2>

    <div class="gauge-wrapper">
      <svg viewBox="0 0 200 200" class="gauge-svg">
        <!-- Track -->
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="#2e2e3e" stroke-width="20" />

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
        <text x="100" y="92" text-anchor="middle" class="pct-text" fill={gaugeColor}>
          {trustPct}%
        </text>
        <text x="100" y="112" text-anchor="middle" class="pct-label" fill="#888"> vérifié </text>
        <text x="100" y="130" text-anchor="middle" class="pct-sub" fill="#555">
          {finalized} claim{finalized !== 1 ? "s" : ""}
        </text>
      </svg>
    </div>

    <!-- Legend -->
    <div class="legend">
      {#each Object.entries(STATUS_COLOR).filter(([k]) => k !== "pending") as [key, color]}
        {@const count = ($claimStats as Record<string, number>)[key] ?? 0}
        <div class="legend-item">
          <span class="dot" style="background: {color}"></span>
          <span class="legend-label">{STATUS_LABEL[key]}</span>
          <span class="legend-count" style="color: {color}">{count}</span>
        </div>
      {/each}
    </div>

    <!-- Overall totals -->
    <div class="totals">
      <div class="total-row">
        <span>Total analysés</span>
        <strong>{$claimStats.total}</strong>
      </div>
      <div class="total-row">
        <span>En attente</span>
        <strong style="color: #f59e0b">{$claimStats.pending}</strong>
      </div>
    </div>
  </div>

  <div class="claims-section">
    <h2>Derniers claims</h2>
    <div class="claims-list">
      {#each $sortedClaims as c (c.id)}
        <div class="claim-row" style="--color: {STATUS_COLOR[c.status]}">
          <div class="cr-status">
            <span class="cr-dot" style="background: {STATUS_COLOR[c.status]}"></span>
            <span class="cr-label" style="color: {STATUS_COLOR[c.status]}"
              >{STATUS_LABEL[c.status]}</span>
          </div>
          <p class="cr-text">« {c.text} »</p>
          {#if c.explanation}
            <p class="cr-expl">{c.explanation}</p>
          {/if}
        </div>
      {:else}
        <p class="empty">Aucun claim détecté...</p>
      {/each}
    </div>
  </div>
</div>

<style>
  .trust-layout {
    display: grid;
    grid-template-columns: 300px 1fr;
    gap: 2rem;
    align-items: start;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0 0 1rem;
  }

  .gauge-section {
    position: sticky;
    top: 1rem;
    background: #1a1a2a;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .gauge-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 1.25rem;
  }

  .gauge-svg {
    width: 180px;
    height: 180px;
  }

  .pct-text {
    font-size: 2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .pct-label {
    font-size: 0.9rem;
  }

  .pct-sub {
    font-size: 0.75rem;
  }

  .legend {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .legend-label {
    color: #aaa;
    flex: 1;
  }

  .legend-count {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }

  .totals {
    border-top: 1px solid #2e2e3e;
    padding-top: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  .total-row {
    display: flex;
    justify-content: space-between;
    font-size: 0.85rem;
    color: #888;
  }

  .total-row strong {
    color: #ddd;
  }

  .claims-section {
    min-width: 0;
  }

  .claims-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 600px;
    overflow-y: auto;
  }

  .claim-row {
    background: #1e1e2e;
    border-left: 4px solid var(--color);
    border-radius: 8px;
    padding: 0.75rem 1rem;
  }

  .cr-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .cr-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .cr-label {
    font-size: 0.8rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .cr-text {
    color: #e0e0e0;
    font-style: italic;
    font-size: 0.9rem;
    margin: 0 0 0.25rem;
  }

  .cr-expl {
    color: #888;
    font-size: 0.82rem;
    margin: 0;
    line-height: 1.4;
  }

  .empty {
    color: #555;
    text-align: center;
    padding: 2rem;
    margin: 0;
  }

  @media (max-width: 800px) {
    .trust-layout {
      grid-template-columns: 1fr;
    }
    .gauge-section {
      position: static;
    }
  }
</style>
