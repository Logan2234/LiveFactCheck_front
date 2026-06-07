<script lang="ts">
  import { transcriptEntries } from "$lib/stores/audio";
  import { claims, sortedClaims } from "$lib/stores/claims";
  import type { Claim } from "$lib/stores/claims";
  import { STATUS_COLOR, STATUS_ICON } from "$lib/constants/status";

  let selectedClaim = $state<Claim | null>(null);

  // For each transcript entry, find claims within ±15s of it
  function claimsForEntry(entryTs: number): Claim[] {
    return $claims.filter(
      (c) => c.status !== "pending" && Math.abs(c.timestamp - entryTs) < 15_000
    );
  }

  function toggleClaim(c: Claim) {
    selectedClaim = selectedClaim?.id === c.id ? null : c;
  }
</script>

<div class="annotation-layout">
  <div class="main-panel">
    <h2>📝 Transcription annotée</h2>

    {#if $transcriptEntries.length === 0}
      <p class="empty">En attente de transcription...</p>
    {:else}
      <div class="entries">
        {#each [...$transcriptEntries].reverse() as entry (entry.timestamp)}
          {@const related = claimsForEntry(entry.timestamp)}
          <div class="entry" class:has-claims={related.length > 0}>
            <div class="entry-header">
              <span class="time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
              {#if related.length > 0}
                <div class="badges">
                  {#each related as c (c.id)}
                    <button
                      class="badge"
                      style="--color: {STATUS_COLOR[c.status]}"
                      class:active={selectedClaim?.id === c.id}
                      onclick={() => toggleClaim(c)}
                      title={c.text}>
                      {STATUS_ICON[c.status]}
                    </button>
                  {/each}
                </div>
              {/if}
            </div>
            <p class="text">{entry.text}</p>

            {#if related.some((c) => c.id === selectedClaim?.id)}
              {@const c = related.find((c) => c.id === selectedClaim?.id)!}
              <div class="claim-detail" style="--color: {STATUS_COLOR[c.status]}">
                <p class="claim-text">« {c.text} »</p>
                {#if c.explanation}
                  <p class="explanation">{c.explanation}</p>
                {/if}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>

  <aside class="side-panel">
    <h2>📊 Claims ({$claims.length})</h2>
    <div class="side-list">
      {#each $sortedClaims as c (c.id)}
        <button
          class="side-item"
          style="--color: {STATUS_COLOR[c.status]}"
          class:active={selectedClaim?.id === c.id}
          onclick={() => toggleClaim(c)}>
          <span class="si-icon">{STATUS_ICON[c.status]}</span>
          <span class="si-text">{c.text}</span>
        </button>
      {:else}
        <p class="empty">Aucun claim détecté</p>
      {/each}
    </div>
  </aside>
</div>

<style>
  .annotation-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 2rem;
    align-items: start;
  }

  h2 {
    font-size: 1.1rem;
    margin: 0 0 0.75rem;
  }

  .main-panel {
    min-width: 0;
  }

  .entries {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .entry {
    background: #1e1e2e;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    border-left: 4px solid transparent;
    transition: border-color 0.2s;
  }

  .entry.has-claims {
    border-left-color: #5555aa;
  }

  .entry-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.3rem;
  }

  .time {
    color: #555;
    font-size: 0.75rem;
    font-variant-numeric: tabular-nums;
  }

  .badges {
    display: flex;
    gap: 0.25rem;
    margin-left: auto;
  }

  .badge {
    background: color-mix(in srgb, var(--color) 20%, transparent);
    border: 1px solid var(--color);
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    cursor: pointer;
    transition:
      transform 0.15s,
      background 0.15s;
    padding: 0;
  }

  .badge:hover,
  .badge.active {
    background: color-mix(in srgb, var(--color) 40%, transparent);
    transform: scale(1.15);
  }

  .text {
    color: #ccc;
    font-size: 0.95rem;
    line-height: 1.6;
    margin: 0;
  }

  .claim-detail {
    margin-top: 0.6rem;
    padding: 0.6rem 0.75rem;
    border-left: 3px solid var(--color);
    background: color-mix(in srgb, var(--color) 10%, transparent);
    border-radius: 0 6px 6px 0;
  }

  .claim-text {
    font-style: italic;
    color: #e0e0e0;
    font-size: 0.9rem;
    margin: 0 0 0.25rem;
  }

  .explanation {
    color: #aaa;
    font-size: 0.85rem;
    margin: 0;
  }

  .side-panel {
    position: sticky;
    top: 1rem;
  }

  .side-list {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 600px;
    overflow-y: auto;
  }

  .side-item {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    background: #1e1e2e;
    border: 1px solid #2e2e3e;
    border-left: 3px solid var(--color);
    border-radius: 6px;
    padding: 0.5rem 0.6rem;
    cursor: pointer;
    text-align: left;
    width: 100%;
    transition: background 0.15s;
  }

  .side-item:hover,
  .side-item.active {
    background: #252535;
  }

  .si-icon {
    font-size: 0.8rem;
    flex-shrink: 0;
    margin-top: 1px;
  }

  .si-text {
    color: #ccc;
    font-size: 0.8rem;
    line-height: 1.4;
  }

  .empty {
    color: #555;
    text-align: center;
    padding: 2rem;
    margin: 0;
  }

  @media (max-width: 900px) {
    .annotation-layout {
      grid-template-columns: 1fr;
    }
    .side-panel {
      position: static;
    }
  }
</style>
