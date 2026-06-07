<script lang="ts">
  import { transcriptEntries } from "$lib/stores/audio";
  import { claims } from "$lib/stores/claims";
  import { STATUS_COLOR, STATUS_ICON, STATUS_LABEL } from "$lib/constants/status";

  // Merge transcripts and claims into a unified chronological feed
  type ChatItem =
    | { kind: "transcript"; text: string; timestamp: number }
    | {
        kind: "claim";
        id: string;
        text: string;
        status: string;
        explanation: string;
        timestamp: number;
      };

  let feed = $derived<ChatItem[]>(
    [
      ...$transcriptEntries.map((e) => ({ kind: "transcript" as const, ...e })),
      ...$claims.map((c) => ({ kind: "claim" as const, ...c }))
    ].sort((a, b) => a.timestamp - b.timestamp)
  );
</script>

<div class="chat-layout">
  <div class="chat-header">
    <div class="ch-left">
      <div class="avatar speaker">🎙</div>
      <span>Speaker</span>
    </div>
    <div class="ch-center">vs</div>
    <div class="ch-right">
      <span>Fact-Checker</span>
      <div class="avatar fc">🔍</div>
    </div>
  </div>

  <div class="chat-feed">
    {#if feed.length === 0}
      <div class="empty">
        <p>La conversation commencera quand vous parlerez...</p>
      </div>
    {:else}
      {#each feed as item (item.kind === "claim" ? item.id : item.timestamp + item.text)}
        {#if item.kind === "transcript"}
          <!-- Left bubble: speaker -->
          <div class="msg-row speaker-row">
            <div class="avatar-sm">🎙</div>
            <div class="bubble speaker-bubble">
              <p class="bubble-text">{item.text}</p>
              <span class="bubble-time">{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        {:else}
          <!-- Right bubble: fact-checker -->
          <div class="msg-row fc-row">
            <div class="bubble fc-bubble" style="--color: {STATUS_COLOR[item.status]}">
              <div class="fc-status">
                <span class="fc-icon">{STATUS_ICON[item.status]}</span>
                <span class="fc-label" style="color: {STATUS_COLOR[item.status]}">
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
              <p class="bubble-text italic">« {item.text} »</p>
              {#if item.explanation && item.status !== "pending"}
                <p class="fc-expl">{item.explanation}</p>
              {/if}
              <span class="bubble-time">{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            <div class="avatar-sm">🤖</div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>

<style>
  .chat-layout {
    display: flex;
    flex-direction: column;
    height: calc(100vh - 160px);
    min-height: 500px;
  }

  .chat-header {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    background: #1a1a2e;
    border-radius: 10px 10px 0 0;
    border: 1px solid #2e2e4e;
    border-bottom: none;
    font-size: 0.85rem;
    color: #888;
  }

  .ch-left {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .ch-center {
    color: #444;
    font-size: 0.75rem;
    flex: 0 0 auto;
    padding: 0 1rem;
  }

  .ch-right {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
    justify-content: flex-end;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #2e2e4e;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
  }

  .avatar-sm {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #252535;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.9rem;
    flex-shrink: 0;
    align-self: flex-end;
  }

  /* Feed */
  .chat-feed {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: #0f0f1e;
    border: 1px solid #2e2e4e;
    border-top: none;
    border-radius: 0 0 10px 10px;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .empty {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #444;
    font-size: 0.9rem;
  }

  /* Message rows */
  .msg-row {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    max-width: 70%;
  }

  .speaker-row {
    align-self: flex-start;
  }

  .fc-row {
    align-self: flex-end;
    flex-direction: row;
  }

  /* Bubbles */
  .bubble {
    border-radius: 16px;
    padding: 0.6rem 0.9rem;
    position: relative;
    max-width: 100%;
  }

  .speaker-bubble {
    background: #252540;
    border-radius: 4px 16px 16px 16px;
  }

  .fc-bubble {
    background: color-mix(in srgb, var(--color) 15%, #1a1a2e);
    border: 1px solid color-mix(in srgb, var(--color) 40%, transparent);
    border-radius: 16px 4px 16px 16px;
  }

  .bubble-text {
    color: #e0e0e0;
    font-size: 0.9rem;
    margin: 0 0 0.25rem;
    line-height: 1.5;
  }

  .italic {
    font-style: italic;
  }

  .bubble-time {
    color: #555;
    font-size: 0.72rem;
    display: block;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .fc-status {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-bottom: 0.3rem;
  }

  .fc-icon {
    font-size: 0.85rem;
  }

  .fc-label {
    font-weight: 600;
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .fc-expl {
    color: #aaa;
    font-size: 0.82rem;
    margin: 0.25rem 0 0.1rem;
    line-height: 1.4;
  }
</style>
