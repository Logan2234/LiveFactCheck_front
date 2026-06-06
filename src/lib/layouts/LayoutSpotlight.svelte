<script lang="ts">
  import { claims, sortedClaims } from "$lib/stores/claims";

  const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: "Analyse en cours...", color: "#f59e0b", icon: "⏳" },
    verified: { label: "Vérifié", color: "#10b981", icon: "✅" },
    false: { label: "Faux", color: "#ef4444", icon: "❌" },
    uncertain: { label: "Incertain", color: "#6b7280", icon: "❓" },
    unverifiable: { label: "Non vérifiable", color: "#8b5cf6", icon: "🔍" }
  };

  // Most recent claim
  const spotlight = $derived($claims.length > 0 ? $claims[$claims.length - 1] : null);

  const strip = $sortedClaims;

  let selectedId = $state<string | null>(null);

  // Shown claim: selected from strip, or default to most recent
  const shown = $derived(
    (() => {
      if (selectedId) {
        const found = $claims.find((c) => c.id === selectedId);
        if (found) return found;
      }
      return $claims.length > 0 ? $claims[$claims.length - 1] : null;
    })()
  );
</script>

<div class="spotlight-layout">
  {#if shown}
    {@const cfg = STATUS_CONFIG[shown.status] ?? STATUS_CONFIG.pending}
    <div class="stage" style="--sc: {cfg.color}">
      <div class="verdict">
        <span class="verdict-icon">{cfg.icon}</span>
        <span class="verdict-label" style="color: {cfg.color}">{cfg.label}</span>
      </div>
      <blockquote class="claim-text">
        « {shown.text} »
      </blockquote>
      {#if shown.explanation}
        <p class="explanation">{shown.explanation}</p>
      {/if}
      <span class="timestamp">{new Date(shown.timestamp).toLocaleTimeString()}</span>
    </div>
  {:else}
    <div class="stage empty">
      <p class="waiting">En attente d'un fait à vérifier...</p>
    </div>
  {/if}

  {#if strip.length > 0}
    <div class="history-strip">
      {#each strip as claim (claim.id)}
        {@const cfg = STATUS_CONFIG[claim.status] ?? STATUS_CONFIG.pending}
        <button
          class="strip-pill"
          class:selected={selectedId === claim.id || (!selectedId && claim.id === spotlight?.id)}
          style="--sc: {cfg.color}"
          onclick={() => (selectedId = claim.id === selectedId ? null : claim.id)}
          title={claim.text}>
          <span class="pill-icon">{cfg.icon}</span>
          <span class="pill-text"
            >{claim.text.slice(0, 40)}{claim.text.length > 40 ? "…" : ""}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .spotlight-layout {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  /* Stage */
  .stage {
    background: #1a1a2a;
    border: 1px solid #2e2e3e;
    border-top: 4px solid var(--sc, #333);
    border-radius: 12px;
    padding: 3rem 4rem;
    text-align: center;
    min-height: 280px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
    transition: border-color 0.3s;
  }

  .stage.empty {
    --sc: #333;
  }

  .verdict {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .verdict-icon {
    font-size: 2rem;
  }

  .verdict-label {
    font-size: 1.4rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .claim-text {
    font-size: 1.35rem;
    font-style: italic;
    color: #e0e0e0;
    margin: 0;
    max-width: 680px;
    line-height: 1.5;
  }

  .explanation {
    font-size: 1rem;
    color: #888;
    max-width: 600px;
    line-height: 1.6;
    margin: 0;
  }

  .timestamp {
    font-size: 0.8rem;
    color: #444;
    font-variant-numeric: tabular-nums;
  }

  .waiting {
    color: #444;
    font-size: 1.1rem;
    margin: 0;
  }

  /* History strip */
  .history-strip {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.25rem;
  }

  .strip-pill {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    background: #1e1e2e;
    border: 1px solid #2e2e3e;
    border-radius: 20px;
    padding: 0.3rem 0.75rem;
    cursor: pointer;
    white-space: nowrap;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .strip-pill:hover {
    border-color: var(--sc);
  }

  .strip-pill.selected {
    background: #222235;
    border-color: var(--sc);
  }

  .pill-icon {
    font-size: 0.85rem;
  }

  .pill-text {
    font-size: 0.78rem;
    color: #aaa;
  }
</style>
