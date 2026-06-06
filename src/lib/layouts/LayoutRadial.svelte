<script lang="ts">
  import { claims, claimStats, sortedClaims } from "$lib/stores/claims";
  import { STATUS_COLOR, STATUS_ICON, STATUS_LABEL } from "$lib/constants/status";

  const R = 70;
  const R_INNER = 42; // hole radius
  const C = 2 * Math.PI * R;
  const CX = 100;
  const CY = 100;

  const STATUS_ORDER = ["verified", "false", "uncertain", "unverifiable", "pending"];

  type Arc = {
    key: string;
    count: number;
    pct: number;
    color: string;
    dasharray: string;
    dashoffset: number;
  };

  let arcs = $derived<Arc[]>((() => {
    const total = $claimStats.total;
    if (total === 0) return [];
    let offset = 0;
    return STATUS_ORDER.map((key) => {
      const count = ($claimStats as Record<string, number>)[key] ?? 0;
      const pct = count / total;
      const dash = pct * C;
      const arc: Arc = {
        key,
        count,
        pct,
        color: STATUS_COLOR[key],
        dasharray: `${dash} ${C - dash}`,
        dashoffset: -offset,
      };
      offset += dash;
      return arc;
    }).filter((a) => a.count > 0);
  })());

  // Dominant status (most claims, excluding pending)
  let dominant = $derived(
    STATUS_ORDER.slice(0, 4)
      .map((k) => ({ key: k, count: ($claimStats as Record<string, number>)[k] ?? 0 }))
      .sort((a, b) => b.count - a.count)[0] ?? null
  );

  let hoveredArc = $state<string | null>(null);
</script>

<div class="radial-layout">
  <div class="donut-section">
    <h2>📈 Répartition des claims</h2>

    <div class="donut-wrapper">
      <svg viewBox="0 0 200 200" class="donut-svg">
        <!-- Background track -->
        <circle
          cx={CX} cy={CY} r={R}
          fill="none"
          stroke="#1e1e2e"
          stroke-width="28"
        />

        {#if arcs.length === 0}
          <!-- Empty state: dashed ring -->
          <circle
            cx={CX} cy={CY} r={R}
            fill="none"
            stroke="#2e2e3e"
            stroke-width="28"
            stroke-dasharray="4 4"
          />
        {:else}
          <g transform="rotate(-90 100 100)">
            {#each arcs as arc (arc.key)}
              <circle
                cx={CX} cy={CY} r={R}
                fill="none"
                stroke={arc.color}
                stroke-width={hoveredArc === arc.key ? 32 : 28}
                stroke-dasharray={arc.dasharray}
                stroke-dashoffset={arc.dashoffset}
                class="arc"
                onmouseenter={() => (hoveredArc = arc.key)}
                onmouseleave={() => (hoveredArc = null)}
                style="transition: stroke-width 0.15s"
              />
            {/each}
          </g>
        {/if}

        <!-- Center: total count -->
        <text x="100" y="90" text-anchor="middle" class="center-num" fill="#e0e0e0">
          {$claimStats.total}
        </text>
        <text x="100" y="107" text-anchor="middle" class="center-label" fill="#666">
          claim{$claimStats.total !== 1 ? "s" : ""}
        </text>
        {#if dominant && dominant.count > 0}
          <text x="100" y="122" text-anchor="middle" class="center-dominant" fill={STATUS_COLOR[dominant.key]}>
            {STATUS_ICON[dominant.key]} {Math.round((dominant.count / $claimStats.total) * 100)}%
          </text>
        {/if}
      </svg>
    </div>

    <!-- Legend -->
    <div class="legend">
      {#each STATUS_ORDER as key (key)}
        {@const count = ($claimStats as Record<string, number>)[key] ?? 0}
        {@const pct = $claimStats.total > 0 ? Math.round((count / $claimStats.total) * 100) : 0}
        <div
          class="legend-row"
          class:hovered={hoveredArc === key}
          onmouseenter={() => count > 0 && (hoveredArc = key)}
          onmouseleave={() => (hoveredArc = null)}
          role="none"
        >
          <span class="l-dot" style="background: {STATUS_COLOR[key]}"></span>
          <span class="l-label">{STATUS_LABEL[key]}</span>
          <div class="l-bar-wrap">
            <div
              class="l-bar"
              style="width: {pct}%; background: {STATUS_COLOR[key]}"
            ></div>
          </div>
          <span class="l-count" style="color: {STATUS_COLOR[key]}">{count}</span>
          <span class="l-pct">{pct}%</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Claims list -->
  <div class="claims-section">
    <h2>Tous les claims</h2>
    <div class="claims-list">
      {#each $sortedClaims as c (c.id)}
        <div
          class="claim-item"
          style="--color: {STATUS_COLOR[c.status]}"
          class:highlighted={hoveredArc === c.status}
        >
          <div class="ci-header">
            <span>{STATUS_ICON[c.status]}</span>
            <span class="ci-status" style="color: {STATUS_COLOR[c.status]}">{STATUS_LABEL[c.status]}</span>
            <span class="ci-time">{new Date(c.timestamp).toLocaleTimeString()}</span>
          </div>
          <p class="ci-text">« {c.text} »</p>
          {#if c.explanation && c.status !== "pending"}
            <p class="ci-expl">{c.explanation}</p>
          {/if}
        </div>
      {:else}
        <p class="empty">Aucun claim détecté...</p>
      {/each}
    </div>
  </div>
</div>

<style>
  .radial-layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    gap: 2rem;
    align-items: start;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0 0 1rem;
  }

  /* Donut */
  .donut-section {
    position: sticky;
    top: 1rem;
    background: #1a1a2a;
    border-radius: 12px;
    padding: 1.5rem;
  }

  .donut-wrapper {
    display: flex;
    justify-content: center;
    margin-bottom: 1.5rem;
  }

  .donut-svg {
    width: 200px;
    height: 200px;
    display: block;
  }

  .center-num {
    font-size: 2.2rem;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .center-label {
    font-size: 0.9rem;
  }

  .center-dominant {
    font-size: 0.85rem;
    font-weight: 600;
  }

  .arc {
    cursor: pointer;
  }

  /* Legend */
  .legend {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .legend-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.2rem 0.3rem;
    border-radius: 4px;
    transition: background 0.15s;
    cursor: default;
  }

  .legend-row.hovered {
    background: #252535;
  }

  .l-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .l-label {
    color: #aaa;
    font-size: 0.82rem;
    width: 110px;
    flex-shrink: 0;
  }

  .l-bar-wrap {
    flex: 1;
    background: #1e1e2e;
    border-radius: 2px;
    height: 4px;
    overflow: hidden;
  }

  .l-bar {
    height: 100%;
    border-radius: 2px;
    transition: width 0.4s;
  }

  .l-count {
    font-size: 0.82rem;
    font-weight: 600;
    width: 18px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .l-pct {
    color: #555;
    font-size: 0.75rem;
    width: 28px;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  /* Claims */
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

  .claim-item {
    background: #1e1e2e;
    border-left: 4px solid var(--color);
    border-radius: 8px;
    padding: 0.75rem 1rem;
    transition: background 0.15s;
  }

  .claim-item.highlighted {
    background: #252535;
  }

  .ci-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.3rem;
    font-size: 0.82rem;
  }

  .ci-status {
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .ci-time {
    margin-left: auto;
    color: #666;
    font-variant-numeric: tabular-nums;
  }

  .ci-text {
    color: #e0e0e0;
    font-style: italic;
    font-size: 0.9rem;
    margin: 0 0 0.25rem;
  }

  .ci-expl {
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

  @media (max-width: 900px) {
    .radial-layout {
      grid-template-columns: 1fr;
    }
    .donut-section {
      position: static;
    }
  }
</style>
