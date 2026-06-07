<script lang="ts">
  import type { Claim } from "$lib/stores/claims";

  let { claim }: { claim: Claim } = $props();

  const statusConfig: Record<string, { label: string; color: string; icon: string }> = {
    pending: { label: "En cours...", color: "#f59e0b", icon: "⏳" },
    verified: { label: "Vérifié", color: "#10b981", icon: "✅" },
    false: { label: "Faux", color: "#ef4444", icon: "❌" },
    uncertain: { label: "Incertain", color: "#6b7280", icon: "❓" },
    unverifiable: { label: "Non vérifiable", color: "#8b5cf6", icon: "🔍" }
  };

  const categoryColors: Record<string, string> = {
    politique: "#3b82f6",
    économie: "#f59e0b",
    science: "#06b6d4",
    santé: "#10b981",
    histoire: "#8b5cf6",
    sport: "#f97316",
    société: "#ec4899",
    technologie: "#6366f1",
    autre: "#6b7280"
  };

  let config = $derived(statusConfig[claim.status] || statusConfig.pending);
  let catColor = $derived(categoryColors[claim.category] || categoryColors.autre);

  let copied = $state(false);

  function copy() {
    const lines = [
      `${config.icon} ${config.label} — ${claim.text}`,
      claim.explanation ? `→ ${claim.explanation}` : "",
      claim.counter_claim ? `✔ Réalité : ${claim.counter_claim}` : "",
      claim.sources.length ? `Sources : ${claim.sources.join(", ")}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    navigator.clipboard.writeText(lines).then(() => {
      copied = true;
      setTimeout(() => (copied = false), 1500);
    });
  }
</script>

<div class="claim-card" style="--status-color: {config.color}">
  <div class="claim-header">
    <span class="status-icon">{config.icon}</span>
    <span class="status-label" style="color: {config.color}">{config.label}</span>

    {#if claim.category && claim.status !== "pending"}
      <span class="category-badge" style="--cat: {catColor}">{claim.category}</span>
    {/if}

    {#if claim.status !== "pending"}
      <span
        class="web-badge"
        class:used={claim.web_search_used}
        title={claim.web_search_used
          ? "Vérifié avec une recherche web"
          : "Vérifié sans recherche web (connaissances internes)"}>
        {claim.web_search_used ? "🌐" : "🧠"}
      </span>
    {/if}

    {#if claim.confidence > 0 && claim.status !== "pending"}
      <span class="confidence" title="Score de confiance">
        <span
          class="confidence-bar"
          style="width: {claim.confidence * 10}%; background: {config.color}"></span>
        <span class="confidence-value">{claim.confidence}/10</span>
      </span>
    {/if}

    <span class="timestamp">{new Date(claim.timestamp).toLocaleTimeString()}</span>

    <button class="copy-btn" onclick={copy} title="Copier ce claim" aria-label="Copier">
      {copied ? "✓" : "⎘"}
    </button>
  </div>

  <p class="claim-text">« {claim.text} »</p>

  {#if claim.explanation}
    <p class="explanation">{claim.explanation}</p>
  {/if}

  {#if claim.counter_claim}
    <div class="counter-claim">
      <span class="counter-label">✔ Réalité :</span>
      <span class="counter-text">{claim.counter_claim}</span>
    </div>
  {/if}

  {#if claim.sources.length > 0}
    <div class="sources">
      <span class="sources-label">Sources :</span>
      {#each claim.sources as source}
        <a href={source} target="_blank" rel="noopener noreferrer">{source}</a>
      {/each}
    </div>
  {/if}
</div>

<style>
  .claim-card {
    border-left: 4px solid var(--status-color);
    background: #1e1e2e;
    border-radius: 8px;
    padding: 0.85rem 1rem;
    margin-bottom: 0.75rem;
  }

  .claim-header {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
  }

  .status-label {
    font-weight: 600;
    font-size: 0.85rem;
  }

  .category-badge {
    background: color-mix(in srgb, var(--cat) 20%, transparent);
    border: 1px solid color-mix(in srgb, var(--cat) 50%, transparent);
    color: var(--cat);
    border-radius: 999px;
    padding: 0.1rem 0.55rem;
    font-size: 0.72rem;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  .web-badge {
    font-size: 0.78rem;
    line-height: 1;
    opacity: 0.85;
    cursor: help;
  }

  .confidence {
    display: flex;
    align-items: center;
    gap: 0.3rem;
    margin-left: 0.1rem;
  }

  .confidence-bar {
    display: inline-block;
    height: 4px;
    border-radius: 2px;
    min-width: 4px;
    max-width: 48px;
    opacity: 0.8;
  }

  .confidence-value {
    color: #666;
    font-size: 0.72rem;
    font-variant-numeric: tabular-nums;
  }

  .timestamp {
    margin-left: auto;
    color: #888;
    font-size: 0.78rem;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }

  .copy-btn {
    background: none;
    border: 1px solid transparent;
    color: #555;
    cursor: pointer;
    font-size: 0.85rem;
    padding: 0.1rem 0.35rem;
    border-radius: 4px;
    line-height: 1;
    transition: all 0.15s;
    flex-shrink: 0;
  }

  .copy-btn:hover {
    border-color: #3e3e4e;
    color: #aaa;
  }

  .claim-text {
    font-style: italic;
    color: #e0e0e0;
    margin: 0.2rem 0;
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .explanation {
    color: #aaa;
    font-size: 0.875rem;
    margin: 0.45rem 0 0;
    line-height: 1.5;
  }

  .counter-claim {
    margin-top: 0.5rem;
    background: color-mix(in srgb, #10b981 12%, transparent);
    border-left: 3px solid #10b981;
    border-radius: 0 6px 6px 0;
    padding: 0.4rem 0.65rem;
    font-size: 0.875rem;
  }

  .counter-label {
    color: #10b981;
    font-weight: 600;
    margin-right: 0.35rem;
  }

  .counter-text {
    color: #ccc;
  }

  .sources {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .sources-label {
    color: #666;
  }

  .sources a {
    color: #60a5fa;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sources a:hover {
    text-decoration: underline;
  }
</style>
