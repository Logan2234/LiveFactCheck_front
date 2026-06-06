<script lang="ts">
  import { transcriptEntries } from "$lib/stores/audio";
  import { claims } from "$lib/stores/claims";
  import { STATUS_COLOR, STATUS_ICON } from "$lib/constants/status";

  // Ticker items: only finalized claims, repeated so there's always enough to scroll
  let tickerItems = $derived(
    $claims.filter((c) => c.status !== "pending")
  );

  // Duplicate items so the ticker loops smoothly
  let tickerContent = $derived(
    tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : []
  );
</script>

<div class="ticker-layout">
  <!-- Main transcript area -->
  <div class="transcript-area">
    <div class="transcript-header">
      <h2>📡 LiveFactChecker — En direct</h2>
      <div class="live-dot"></div>
    </div>

    <div class="transcript-content">
      {#if $transcriptEntries.length === 0}
        <p class="waiting">En attente de la transcription...</p>
      {:else}
        {#each [...$transcriptEntries].reverse() as entry (entry.timestamp)}
          <div class="transcript-entry">
            <span class="ts-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span class="ts-text">{entry.text}</span>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Stats bar -->
    <div class="stats-bar">
      <span class="stat" style="color: #10b981">✅ {$claims.filter(c => c.status === 'verified').length} vérifiés</span>
      <span class="stat" style="color: #ef4444">❌ {$claims.filter(c => c.status === 'false').length} faux</span>
      <span class="stat" style="color: #f59e0b">❓ {$claims.filter(c => c.status === 'uncertain').length} incertains</span>
      <span class="stat" style="color: #888">Total: {$claims.length}</span>
    </div>
  </div>

  <!-- Ticker band -->
  <div class="ticker-band">
    <div class="ticker-label">FACT CHECK</div>
    <div class="ticker-scroll-wrapper">
      {#if tickerContent.length === 0}
        <div class="ticker-empty">En attente des claims...</div>
      {:else}
        <div
          class="ticker-track"
          style="animation-duration: {Math.max(tickerItems.length * 8, 20)}s"
        >
          {#each tickerContent as c (c.id + Math.random())}
            <span class="ticker-item" style="--color: {STATUS_COLOR[c.status]}">
              <span class="t-icon">{STATUS_ICON[c.status]}</span>
              <span class="t-text">{c.text}</span>
            </span>
            <span class="ticker-sep">◆</span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .ticker-layout {
    display: flex;
    flex-direction: column;
    gap: 0;
    height: calc(100vh - 160px);
    min-height: 500px;
  }

  h2 {
    font-size: 1.2rem;
    margin: 0;
  }

  /* Transcript */
  .transcript-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: #0d0d1a;
    border-radius: 10px 10px 0 0;
    overflow: hidden;
    border: 1px solid #1e1e3e;
    border-bottom: none;
  }

  .transcript-header {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1.25rem;
    background: #1a1a2e;
    border-bottom: 1px solid #2e2e4e;
  }

  .live-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #ef4444;
    animation: pulse 1.5s ease-in-out infinite;
    margin-left: auto;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.5; transform: scale(0.8); }
  }

  .transcript-content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    font-size: 1.05rem;
    line-height: 1.7;
  }

  .transcript-entry {
    display: flex;
    gap: 0.75rem;
    align-items: baseline;
  }

  .ts-time {
    color: #444;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
    flex-shrink: 0;
    margin-top: 0.2rem;
  }

  .ts-text {
    color: #d0d0d0;
  }

  .waiting {
    color: #444;
    margin: auto;
    text-align: center;
  }

  .stats-bar {
    display: flex;
    gap: 1.5rem;
    padding: 0.5rem 1.25rem;
    background: #0d0d1a;
    border-top: 1px solid #1e1e3e;
    font-size: 0.8rem;
  }

  .stat {
    font-variant-numeric: tabular-nums;
  }

  /* Ticker band */
  .ticker-band {
    display: flex;
    align-items: stretch;
    height: 42px;
    background: #cc0000;
    border-radius: 0 0 10px 10px;
    overflow: hidden;
    border: 1px solid #ff0000;
    border-top: none;
  }

  .ticker-label {
    background: #ff0000;
    color: #fff;
    font-weight: 800;
    font-size: 0.75rem;
    letter-spacing: 0.1em;
    padding: 0 1rem;
    display: flex;
    align-items: center;
    flex-shrink: 0;
    text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  }

  .ticker-scroll-wrapper {
    flex: 1;
    overflow: hidden;
    display: flex;
    align-items: center;
    background: #1a0000;
  }

  .ticker-empty {
    color: #666;
    font-size: 0.85rem;
    padding: 0 1rem;
  }

  .ticker-track {
    display: flex;
    align-items: center;
    gap: 0;
    white-space: nowrap;
    animation: scroll-left linear infinite;
    will-change: transform;
  }

  @keyframes scroll-left {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  .ticker-item {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0 0.5rem;
    color: var(--color);
  }

  .t-icon {
    font-size: 0.85rem;
  }

  .t-text {
    font-size: 0.85rem;
    color: #ddd;
    max-width: 350px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ticker-sep {
    color: #cc0000;
    font-size: 0.6rem;
    padding: 0 0.5rem;
  }
</style>
