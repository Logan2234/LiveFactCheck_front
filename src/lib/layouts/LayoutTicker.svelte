<script lang="ts">
  import { STATUS_COLOR, STATUS_ICON } from "$lib/constants/status";
  import { reversedTranscript } from "$lib/stores/audio";
  import { claims } from "$lib/stores/claims";
  import { formatTime } from "$lib/utils/format";

  // Ticker items: only finalized claims, repeated so there's always enough to scroll
  let tickerItems = $derived($claims.filter((c) => c.status !== "pending"));

  // Duplicate items so the ticker loops smoothly
  let tickerContent = $derived(
    tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : []
  );
</script>

<div class="flex h-[calc(100vh-160px)] min-h-125 flex-col gap-0">
  <!-- Main transcript area -->
  <div
    class="flex flex-1 flex-col overflow-hidden rounded-t-[10px] border border-b-0 border-edge bg-surface">
    <div
      class="flex items-center gap-3 border-b border-surface-selected bg-surface-alt px-5 py-3">
      <h2 class="m-0 text-xl">📡 LiveFactChecker — En direct</h2>
      <div class="live-dot ml-auto h-2.5 w-2.5 rounded-full bg-red-500"></div>
    </div>

    <div
      class="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4 text-lg leading-[1.7]">
      {#if $reversedTranscript.length === 0}
        <p class="m-auto text-center text-fg-faint">
          En attente de la transcription...
        </p>
      {:else}
        {#each $reversedTranscript as entry (entry.timestamp)}
          <div class="flex items-baseline gap-3">
            <span class="mt-1 shrink-0 text-xs tabular-nums text-fg-faint"
              >{formatTime(entry.timestamp)}</span>
            <span class="text-fg">{entry.text}</span>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Stats bar -->
    <div
      class="flex gap-6 border-t border-edge bg-surface-alt px-5 py-2 text-sm">
      <span class="tabular-nums text-emerald-500"
        >✅ {$claims.filter((c) => c.status === "verified").length} vérifiés</span>
      <span class="tabular-nums text-red-500"
        >❌ {$claims.filter((c) => c.status === "false").length} faux</span>
      <span class="tabular-nums text-amber-500"
        >❓ {$claims.filter((c) => c.status === "uncertain").length} incertains</span>
      <span class="tabular-nums text-fg-muted">Total: {$claims.length}</span>
    </div>
  </div>

  <!-- Ticker band -->
  <div
    class="flex h-10.5 items-stretch overflow-hidden rounded-b-[10px] border border-t-0 border-[#ff0000] bg-[#cc0000]">
    <div
      class="flex shrink-0 items-center bg-[#ff0000] px-4 text-xs font-extrabold tracking-widest text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]">
      FACT CHECK
    </div>
    <div class="flex flex-1 items-center overflow-hidden bg-[#1a0000]">
      {#if tickerContent.length === 0}
        <div class="px-4 text-sm text-zinc-400">En attente des claims...</div>
      {:else}
        <div
          class="ticker-track flex items-center gap-0 whitespace-nowrap will-change-transform"
          style="animation-duration: {Math.max(tickerItems.length * 8, 20)}s">
          {#each tickerContent as c, i (c.id + "-" + i)}
            <span
              class="inline-flex items-center gap-1.5 px-2 text-(--color)"
              style="--color: {STATUS_COLOR[c.status]}">
              <span class="text-sm">{STATUS_ICON[c.status]}</span>
              <span
                class="max-w-87.5 overflow-hidden text-sm text-ellipsis text-zinc-200"
                >{c.text}</span>
            </span>
            <span class="px-2 text-2.5 text-red-700">◆</span>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  /* Animations (live pulse, scrolling ticker) — keyframes can't be utilities.
     The ticker scroll duration is set inline since it depends on item count. */
  .live-dot {
    animation: pulse 1.5s ease-in-out infinite;
  }

  @keyframes pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.8);
    }
  }

  .ticker-track {
    animation: scroll-left linear infinite;
  }

  @keyframes scroll-left {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }
</style>
