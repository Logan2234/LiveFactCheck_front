<script lang="ts">
  import { claims, claimStats } from "$lib/stores/claims";
  import type { VerificationStatus } from "$lib/stores/claims";

  const COLS: { key: VerificationStatus; label: string; icon: string; color: string }[] = [
    { key: "verified", label: "Vrais", icon: "✅", color: "#10b981" },
    { key: "false", label: "Faux", icon: "❌", color: "#ef4444" },
    { key: "pending", label: "En cours", icon: "⏳", color: "#f59e0b" },
    { key: "uncertain", label: "Incertains", icon: "❓", color: "#6b7280" },
    { key: "unverifiable", label: "Invérifiables", icon: "🔍", color: "#8b5cf6" }
  ];
</script>

<div class="kanban">
  {#each COLS as col}
    {@const colClaims = [...$claims].filter((c) => c.status === col.key).reverse()}
    <div class="column" style="--col-color: {col.color}">
      <div class="col-header">
        <span class="col-icon">{col.icon}</span>
        <span class="col-label">{col.label}</span>
        <span class="col-count">{colClaims.length}</span>
      </div>
      <div class="col-cards">
        {#each colClaims as claim (claim.id)}
          <div class="kanban-card">
            <p class="card-text">« {claim.text} »</p>
            {#if claim.explanation}
              <p class="card-expl">{claim.explanation}</p>
            {/if}
            <span class="card-time">{new Date(claim.timestamp).toLocaleTimeString()}</span>
          </div>
        {/each}
        {#if colClaims.length === 0}
          <p class="col-empty">—</p>
        {/if}
      </div>
    </div>
  {/each}
</div>

<style>
  .kanban {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 0.75rem;
    align-items: start;
    overflow-x: auto;
  }

  .column {
    background: #1a1a2a;
    border-radius: 8px;
    overflow: hidden;
    min-width: 160px;
  }

  .col-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.6rem 0.75rem;
    border-top: 3px solid var(--col-color);
    background: #1e1e2e;
  }

  .col-label {
    font-size: 0.8rem;
    font-weight: 600;
    color: #aaa;
    flex: 1;
  }

  .col-count {
    font-size: 0.75rem;
    background: #2e2e3e;
    color: #888;
    border-radius: 10px;
    padding: 0.1rem 0.45rem;
    font-variant-numeric: tabular-nums;
  }

  .col-cards {
    padding: 0.5rem;
    max-height: calc(100vh - 240px);
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .kanban-card {
    background: #222233;
    border-radius: 6px;
    padding: 0.6rem 0.75rem;
    border-left: 3px solid var(--col-color);
  }

  .card-text {
    font-size: 0.82rem;
    color: #ccc;
    margin: 0 0 0.3rem;
    font-style: italic;
    line-height: 1.4;
  }

  .card-expl {
    font-size: 0.75rem;
    color: #777;
    margin: 0 0 0.4rem;
    line-height: 1.3;
  }

  .card-time {
    font-size: 0.7rem;
    color: #444;
    font-variant-numeric: tabular-nums;
  }

  .col-empty {
    text-align: center;
    color: #333;
    padding: 1rem 0;
    margin: 0;
    font-size: 1.2rem;
  }

  @media (max-width: 900px) {
    .kanban {
      grid-template-columns: repeat(3, 1fr);
    }
  }
</style>
