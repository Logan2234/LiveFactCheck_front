<script lang="ts">
  import { claims } from "$lib/stores/claims";
  import type { Claim } from "$lib/stores/claims";
  import { STATUS_COLOR, STATUS_ICON, STATUS_LABEL } from "$lib/constants/status";

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

<div class="timeline-layout">
  <h2>⏱ Timeline des claims</h2>

  {#if sorted.length === 0}
    <div class="empty-state">
      <p>Aucun claim détecté pour le moment...</p>
      <p class="hint">Les claims apparaîtront ici au fil de la conversation.</p>
    </div>
  {:else}
    <!-- Selected claim detail -->
    <div class="detail-panel" class:visible={selectedClaim !== null}>
      {#if selectedClaim}
        <div class="detail-inner" style="--color: {STATUS_COLOR[selectedClaim.status]}">
          <div class="detail-header">
            <span class="d-icon">{STATUS_ICON[selectedClaim.status]}</span>
            <span class="d-status" style="color: {STATUS_COLOR[selectedClaim.status]}">
              {STATUS_LABEL[selectedClaim.status]}
            </span>
            <span class="d-time">{new Date(selectedClaim.timestamp).toLocaleTimeString()}</span>
            <button class="d-close" onclick={() => (selectedClaim = null)}>✕</button>
          </div>
          <p class="d-text">« {selectedClaim.text} »</p>
          {#if selectedClaim.explanation}
            <p class="d-expl">{selectedClaim.explanation}</p>
          {/if}
        </div>
      {/if}
    </div>

    <!-- SVG timeline -->
    <div class="timeline-wrapper">
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="timeline-axis-svg">
        <!-- Horizontal axis line -->
        <line x1="5" y1="50" x2="95" y2="50" stroke="#2e2e4e" stroke-width="0.5" />
      </svg>

      <svg viewBox="0 0 100 100" class="timeline-dots-svg">
        <!-- Axis line -->
        <line x1="5" y1="50" x2="95" y2="50" stroke="#2e2e4e" stroke-width="0.8" />

        <!-- Vertical tick for each claim -->
        {#each sorted as c, i (c.id)}
          {@const x = xPct(c.timestamp)}
          {@const y = yForIndex(i)}
          <!-- Connector line from dot to axis -->
          <line
            x1={x} y1={y}
            x2={x} y2="50"
            stroke={STATUS_COLOR[c.status]}
            stroke-width="0.5"
            stroke-dasharray="1 1"
            opacity="0.5"
          />
          <!-- Dot -->
          <circle
            cx={x} cy={y} r="4"
            fill={STATUS_COLOR[c.status]}
            stroke={selectedClaim?.id === c.id ? "#fff" : "transparent"}
            stroke-width="1.5"
            class="dot"
            role="button"
            tabindex="0"
            aria-label={c.text}
            onclick={() => selectClaim(c)}
            onkeydown={(e) => e.key === "Enter" && selectClaim(c)}
          />
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
    <p class="click-hint">Cliquez sur un point pour voir les détails.</p>

    <!-- Compact list below -->
    <div class="claim-grid">
      {#each sorted.reverse() as c (c.id)}
        <button
          class="claim-chip"
          style="--color: {STATUS_COLOR[c.status]}"
          class:active={selectedClaim?.id === c.id}
          onclick={() => selectClaim(c)}
        >
          <span class="chip-icon">{STATUS_ICON[c.status]}</span>
          <span class="chip-text">{c.text}</span>
          <span class="chip-time">{new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .timeline-layout {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0;
  }

  .empty-state {
    text-align: center;
    padding: 3rem;
    color: #555;
  }

  .hint {
    font-size: 0.85rem;
    margin-top: 0.5rem;
  }

  /* Detail panel */
  .detail-panel {
    min-height: 80px;
    transition: opacity 0.2s;
    opacity: 0;
    pointer-events: none;
  }

  .detail-panel.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .detail-inner {
    background: #1e1e2e;
    border-left: 4px solid var(--color);
    border-radius: 8px;
    padding: 0.75rem 1rem;
  }

  .detail-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.35rem;
  }

  .d-icon { font-size: 1rem; }

  .d-status {
    font-weight: 600;
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .d-time {
    margin-left: auto;
    color: #666;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
  }

  .d-close {
    background: none;
    border: none;
    color: #666;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0;
    line-height: 1;
  }

  .d-close:hover { color: #aaa; }

  .d-text {
    color: #e0e0e0;
    font-style: italic;
    font-size: 0.9rem;
    margin: 0 0 0.25rem;
  }

  .d-expl {
    color: #888;
    font-size: 0.85rem;
    margin: 0;
    line-height: 1.5;
  }

  /* Timeline SVG */
  .timeline-wrapper {
    background: #1a1a2a;
    border-radius: 10px;
    padding: 0.5rem;
    overflow-x: auto;
  }

  .timeline-dots-svg {
    width: 100%;
    height: 120px;
    display: block;
  }

  .timeline-axis-svg {
    display: none;
  }

  .dot {
    cursor: pointer;
    transition: r 0.15s, opacity 0.15s;
  }

  .dot:hover {
    r: 5.5;
  }

  .click-hint {
    color: #444;
    font-size: 0.8rem;
    text-align: center;
    margin: -0.5rem 0 0;
  }

  /* Claim grid */
  .claim-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 400px;
    overflow-y: auto;
  }

  .claim-chip {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    background: #1e1e2e;
    border: 1px solid #2e2e3e;
    border-left: 3px solid var(--color);
    border-radius: 6px;
    padding: 0.5rem 0.75rem;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background 0.15s;
  }

  .claim-chip:hover,
  .claim-chip.active {
    background: #252535;
  }

  .chip-icon {
    font-size: 0.85rem;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .chip-text {
    color: #ccc;
    font-size: 0.85rem;
    flex: 1;
    line-height: 1.4;
  }

  .chip-time {
    color: #555;
    font-size: 0.75rem;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
    margin-top: 2px;
  }
</style>
