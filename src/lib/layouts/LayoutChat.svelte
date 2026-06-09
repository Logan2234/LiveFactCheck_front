<script lang="ts">
  import { STATUS_COLOR, STATUS_ICON, STATUS_LABEL } from "$lib/constants/status";
  import { transcriptEntries } from "$lib/stores/audio";
  import { claims } from "$lib/stores/claims";

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

<div class="flex h-[calc(100vh-160px)] min-h-125 flex-col">
  <div
    class="flex items-center rounded-t-[10px] border border-b-0 border-surface-selected bg-surface-alt px-4 py-3 text-[0.85rem] text-zinc-500">
    <div class="flex flex-1 items-center gap-2">
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-selected text-base">
        🎙
      </div>
      <span>Speaker</span>
    </div>
    <div class="flex-none px-4 text-xs text-zinc-700">vs</div>
    <div class="flex flex-1 items-center justify-end gap-2">
      <span>Fact-Checker</span>
      <div class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-selected text-base">
        🔍
      </div>
    </div>
  </div>

  <div
    class="flex flex-1 flex-col gap-3 overflow-y-auto rounded-b-[10px] border border-t-0 border-surface-selected bg-[#0f0f1e] p-4">
    {#if feed.length === 0}
      <div class="flex flex-1 items-center justify-center text-[0.9rem] text-zinc-700">
        <p>La conversation commencera quand vous parlerez...</p>
      </div>
    {:else}
      {#each feed as item (item.kind === "claim" ? item.id : item.timestamp + item.text)}
        {#if item.kind === "transcript"}
          <!-- Left bubble: speaker -->
          <div class="flex max-w-[70%] items-end gap-2 self-start">
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-surface-raised text-[0.9rem]">
              🎙
            </div>
            <div
              class="relative max-w-full rounded-2xl rounded-tl-sm bg-[#252540] px-[0.9rem] py-[0.6rem]">
              <p class="mt-0 mb-1 text-[0.9rem] leading-normal text-fg">{item.text}</p>
              <span class="block text-right text-[0.72rem] tabular-nums text-zinc-600"
                >{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
          </div>
        {:else}
          <!-- Right bubble: fact-checker -->
          <div class="flex max-w-[70%] flex-row items-end gap-2 self-end">
            <div
              class="fc-bubble relative max-w-full rounded-2xl rounded-tr-sm px-[0.9rem] py-[0.6rem]"
              style="--color: {STATUS_COLOR[item.status]}">
              <div class="mb-[0.3rem] flex items-center gap-[0.4rem]">
                <span class="text-[0.85rem]">{STATUS_ICON[item.status]}</span>
                <span
                  class="text-[0.8rem] font-semibold tracking-wider uppercase"
                  style="color: {STATUS_COLOR[item.status]}">
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
              <p class="mt-0 mb-1 text-[0.9rem] leading-normal text-fg italic">
                « {item.text} »
              </p>
              {#if item.explanation && item.status !== "pending"}
                <p class="mt-1 mb-[0.1rem] text-[0.82rem] leading-[1.4] text-zinc-400">
                  {item.explanation}
                </p>
              {/if}
              <span class="block text-right text-[0.72rem] tabular-nums text-zinc-600"
                >{new Date(item.timestamp).toLocaleTimeString()}</span>
            </div>
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-surface-raised text-[0.9rem]">
              🤖
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>

<style>
  /* Fact-checker bubble tint mixes the JS-injected status --color, so the
     background/border can't be static utilities. */
  .fc-bubble {
    background: color-mix(in srgb, var(--color) 15%, var(--color-surface-alt));
    border: 1px solid color-mix(in srgb, var(--color) 40%, transparent);
  }
</style>
