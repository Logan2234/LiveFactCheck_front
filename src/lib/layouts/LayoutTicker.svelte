<script lang="ts">
  import { transcriptEntries } from "$lib/stores/audio";
  import { claims } from "$lib/stores/claims";
  import { STATUS_COLOR, STATUS_ICON } from "$lib/constants/status";

  // Ticker items: only finalized claims, repeated so there's always enough to scroll
  let tickerItems = $derived($claims.filter((c) => c.status !== "pending"));

  // Duplicate items so the ticker loops smoothly
  let tickerContent = $derived(tickerItems.length > 0 ? [...tickerItems, ...tickerItems] : []);
</script>

<div class="flex h-[calc(100vh-160px)] min-h-125 flex-col gap-0">
  <!-- Main transcript area -->
  <div
    class="flex flex-1 flex-col overflow-hidden rounded-t-[10px] border border-b-0 border-[#1e1e3e] bg-[#0d0d1a]">
    <div class="flex items-center gap-3 border-b border-surface-selected bg-surface-alt px-5 py-3">
      <h2 class="m-0 text-[1.2rem]">📡 LiveFactChecker — En direct</h2>
      <div class="live-dot ml-auto h-2.5 w-2.5 rounded-full bg-red-500"></div>
    </div>

    <div class="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4 text-[1.05rem] leading-[1.7]">
      {#if $transcriptEntries.length === 0}
        <p class="m-auto text-center text-zinc-700">En attente de la transcription...</p>
      {:else}
        {#each [...$transcriptEntries].reverse() as entry (entry.timestamp)}
          <div class="flex items-baseline gap-3">
            <span class="mt-[0.2rem] shrink-0 text-xs tabular-nums text-zinc-700"
              >{new Date(entry.timestamp).toLocaleTimeString()}</span>
            <span class="text-[#d0d0d0]">{entry.text}</span>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Stats bar -->
    <div class="flex gap-6 border-t border-[#1e1e3e] bg-[#0d0d1a] px-5 py-2 text-[0.8rem]">
      <span class="tabular-nums text-emerald-500"
        >✅ {$claims.filter((c) => c.status === "verified").length} vérifiés</span>
      <span class="tabular-nums text-red-500"
        >❌ {$claims.filter((c) => c.status === "false").length} faux</span>
      <span class="tabular-nums text-amber-500"
        >❓ {$claims.filter((c) => c.status === "uncertain").length} incertains</span>
      <span class="tabular-nums text-zinc-500">Total: {$claims.length}</span>
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
        <div class="px-4 text-[0.85rem] text-zinc-600">En attente des claims...</div>
      {:else}
        <div
          class="ticker-track flex items-center gap-0 whitespace-nowrap will-change-transform"
          style="animation-duration: {Math.max(tickerItems.length * 8, 20)}s">
          {#each tickerContent as c (c.id + Math.random())}
            <span
              class="inline-flex items-center gap-[0.4rem] px-2 text-(--color)"
              style="--color: {STATUS_COLOR[c.status]}">
              <span class="text-[0.85rem]">{STATUS_ICON[c.status]}</span>
              <span class="max-w-87.5 overflow-hidden text-[0.85rem] text-ellipsis text-zinc-200"
                >{c.text}</span>
            </span>
            <span class="px-2 text-[0.6rem] text-[#cc0000]">◆</span>
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
