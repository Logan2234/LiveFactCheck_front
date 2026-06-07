<script lang="ts">
  import { claimFilter, claimStats, filteredClaims, type ClaimFilter } from "$lib/stores/claims";

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: "En cours", color: "#f59e0b", icon: "⏳" },
    verified: { label: "Vérifié", color: "#10b981", icon: "✅" },
    false: { label: "Faux", color: "#ef4444", icon: "❌" },
    uncertain: { label: "Incertain", color: "#6b7280", icon: "❓" },
    unverifiable: { label: "Invérifiable", color: "#8b5cf6", icon: "🔍" }
  };

  const filters: { key: ClaimFilter; label: string; icon: string }[] = [
    { key: "all", label: "Tous", icon: "📋" },
    { key: "verified", label: "Vrais", icon: "✅" },
    { key: "false", label: "Faux", icon: "❌" },
    { key: "pending", label: "En cours", icon: "⏳" },
    { key: "uncertain", label: "Incertains", icon: "❓" },
    { key: "unverifiable", label: "Invérifiables", icon: "🔍" }
  ];

  let expandedId = $state<string | null>(null);
</script>

<div class="table-view">
  <div class="toolbar">
    <div class="filters">
      {#each filters as f}
        <button class:active={$claimFilter === f.key} onclick={() => claimFilter.set(f.key)}>
          {f.icon}
          {f.label}
        </button>
      {/each}
    </div>
    <span class="total"
      >{$filteredClaims.length} fait{$filteredClaims.length !== 1 ? "s" : ""}</span>
  </div>

  <div class="table-wrap">
    <table>
      <thead>
        <tr>
          <th class="col-time">Heure</th>
          <th class="col-status">Statut</th>
          <th class="col-text">Affirmation</th>
          <th class="col-expl">Explication</th>
        </tr>
      </thead>
      <tbody>
        {#if $filteredClaims.length === 0}
          <tr>
            <td colspan="4" class="empty">Aucun fait détecté pour le moment...</td>
          </tr>
        {:else}
          {#each $filteredClaims as claim (claim.id)}
            {@const cfg = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.pending}
            <tr
              class="claim-row"
              class:expanded={expandedId === claim.id}
              style="--sc: {cfg.color}"
              onclick={() => (expandedId = expandedId === claim.id ? null : claim.id)}>
              <td class="col-time">{new Date(claim.timestamp).toLocaleTimeString()}</td>
              <td class="col-status">
                <span class="status-badge" style="color: {cfg.color}">
                  {cfg.icon}
                  {cfg.label}
                </span>
              </td>
              <td class="col-text">
                <span class="claim-text" class:truncated={expandedId !== claim.id}>
                  {claim.text}
                </span>
              </td>
              <td class="col-expl">
                {#if claim.explanation}
                  <span class="expl-text" class:truncated={expandedId !== claim.id}>
                    {claim.explanation}
                  </span>
                {:else if claim.status === "pending"}
                  <span class="analyzing">analyse...</span>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  .table-view {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .filters {
    display: flex;
    gap: 0.4rem;
    flex-wrap: wrap;
  }

  .filters button {
    background: #1e1e2e;
    border: 1px solid #2e2e3e;
    color: #aaa;
    border-radius: 20px;
    padding: 0.3rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .filters button:hover {
    border-color: #555;
    color: #ddd;
  }
  .filters button.active {
    background: #2e2e4e;
    border-color: #5555aa;
    color: #fff;
  }

  .total {
    color: #555;
    font-size: 0.85rem;
    white-space: nowrap;
  }

  /* Table */
  .table-wrap {
    overflow: auto;
    max-height: calc(100vh - 240px);
    border-radius: 8px;
    border: 1px solid #1e1e2e;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  thead {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  th {
    background: #1e1e2e;
    color: #666;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.6rem 0.9rem;
    text-align: left;
    border-bottom: 1px solid #2e2e3e;
  }

  .claim-row {
    border-bottom: 1px solid #1a1a2a;
    border-left: 3px solid transparent;
    cursor: pointer;
    transition:
      background 0.1s,
      border-color 0.1s;
  }

  .claim-row:hover {
    background: #1c1c2c;
    border-left-color: var(--sc);
  }

  .claim-row.expanded {
    background: #1e1e2e;
    border-left-color: var(--sc);
  }

  td {
    padding: 0.65rem 0.9rem;
    vertical-align: top;
  }

  .col-time {
    width: 80px;
    color: #555;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .col-status {
    width: 130px;
    white-space: nowrap;
  }

  .status-badge {
    font-size: 0.8rem;
    font-weight: 500;
  }

  .col-text {
    min-width: 200px;
  }

  .claim-text {
    color: #ccc;
    font-style: italic;
    line-height: 1.4;
  }

  .col-expl {
    min-width: 180px;
  }

  .expl-text {
    color: #777;
    font-size: 0.82rem;
    line-height: 1.4;
  }

  .analyzing {
    color: #444;
    font-size: 0.78rem;
    font-style: italic;
  }

  .truncated {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .empty {
    text-align: center;
    color: #444;
    padding: 3rem;
  }
</style>
