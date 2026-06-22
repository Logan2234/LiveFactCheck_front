<script lang="ts">
  import StatusIcon from "$lib/components/ui/StatusIcon.svelte";
  import { STATUS_COLOR, STATUS_LABEL } from "$lib/constants/status";
  import { transcriptEntries } from "$lib/stores/audio";
  import { claims, type VerificationStatus } from "$lib/stores/claims";
  import { formatTime } from "$lib/utils/format";

  // rec D: STATUS_ICON (emoji) removed — StatusIcon component used instead

  type ChatItem =
    | { kind: "transcript"; text: string; timestamp: number }
    | {
        kind: "claim";
        id: string;
        text: string;
        status: VerificationStatus;
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
  <!-- Header bar — rec D: emoji avatars replaced by SVG icons -->
  <div
    class="flex items-center rounded-t-[10px] border border-b-0 border-surface-selected bg-surface-alt px-4 py-3 text-sm text-fg-muted">
    <div class="flex flex-1 items-center gap-2">
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-selected text-fg-muted">
        <!-- Microphone SVG -->
        <svg
          width="15"
          height="15"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true">
          <rect
            x="4.5"
            y="0.5"
            width="5"
            height="7.5"
            rx="2.5"
            stroke="currentColor"
            stroke-width="1.4" />
          <path
            d="M1.5 7.5C1.5 10.5 4 12.5 7 12.5C10 12.5 12.5 10.5 12.5 7.5"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round"
            fill="none" />
          <line
            x1="7"
            y1="12.5"
            x2="7"
            y2="13.5"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round" />
        </svg>
      </div>
      <span>Speaker</span>
    </div>
    <div class="flex-none px-4 text-xs text-fg-faint">vs</div>
    <div class="flex flex-1 items-center justify-end gap-2">
      <span>Fact-Checker</span>
      <div
        class="flex h-8 w-8 items-center justify-center rounded-full bg-surface-selected text-fg-muted">
        <!-- Magnifying glass SVG -->
        <svg
          width="15"
          height="15"
          viewBox="0 0 14 14"
          fill="none"
          aria-hidden="true">
          <circle
            cx="6"
            cy="6"
            r="4.5"
            stroke="currentColor"
            stroke-width="1.4" />
          <line
            x1="9.5"
            y1="9.5"
            x2="13"
            y2="13"
            stroke="currentColor"
            stroke-width="1.4"
            stroke-linecap="round" />
        </svg>
      </div>
    </div>
  </div>

  <div
    class="flex flex-1 flex-col gap-3 overflow-y-auto rounded-b-[10px] border border-t-0 border-surface-selected bg-surface p-4">
    {#if feed.length === 0}
      <div
        class="flex flex-1 items-center justify-center text-sm text-fg-faint">
        <p>La conversation commencera quand vous parlerez...</p>
      </div>
    {:else}
      {#each feed as item (item.kind === "claim" ? item.id : item.timestamp + item.text)}
        {#if item.kind === "transcript"}
          <!-- Left bubble: speaker -->
          <div class="flex max-w-[70%] items-end gap-2 self-start">
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-surface-raised text-fg-faint">
              <svg
                width="13"
                height="13"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true">
                <rect
                  x="4.5"
                  y="0.5"
                  width="5"
                  height="7.5"
                  rx="2.5"
                  stroke="currentColor"
                  stroke-width="1.4" />
                <path
                  d="M1.5 7.5C1.5 10.5 4 12.5 7 12.5C10 12.5 12.5 10.5 12.5 7.5"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  fill="none" />
                <line
                  x1="7"
                  y1="12.5"
                  x2="7"
                  y2="13.5"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round" />
              </svg>
            </div>
            <div
              class="relative max-w-full rounded-2xl rounded-tl-sm bg-surface-raised px-3.5 py-2.5">
              <p class="mt-0 mb-1 text-sm leading-normal text-fg">
                {item.text}
              </p>
              <span class="block text-right text-2xs tabular-nums text-fg-faint"
                >{formatTime(item.timestamp)}</span>
            </div>
          </div>
        {:else}
          <!-- Right bubble: fact-checker — rec D: StatusIcon + font-display label -->
          <div class="flex max-w-[70%] flex-row items-end gap-2 self-end">
            <div
              class="fc-bubble relative max-w-full rounded-2xl rounded-tr-sm px-3.5 py-2.5"
              style="--color: {STATUS_COLOR[item.status]}">
              <div class="mb-1.5 flex items-center gap-2">
                <StatusIcon status={item.status} size={14} />
                <span
                  class="font-display text-sm font-extrabold tracking-wider uppercase"
                  style="color: {STATUS_COLOR[item.status]}">
                  {STATUS_LABEL[item.status]}
                </span>
              </div>
              <p class="mt-0 mb-1 text-sm leading-normal text-fg italic">
                « {item.text} »
              </p>
              {#if item.explanation && item.status !== "pending"}
                <p class="mt-1 mb-0.5 text-sm leading-snug text-fg-muted">
                  {item.explanation}
                </p>
              {/if}
              <span class="block text-right text-2xs tabular-nums text-fg-faint"
                >{formatTime(item.timestamp)}</span>
            </div>
            <div
              class="flex h-7 w-7 shrink-0 items-center justify-center self-end rounded-full bg-surface-raised text-fg-faint">
              <svg
                width="13"
                height="13"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true">
                <circle
                  cx="6"
                  cy="6"
                  r="4.5"
                  stroke="currentColor"
                  stroke-width="1.4" />
                <line
                  x1="9.5"
                  y1="9.5"
                  x2="13"
                  y2="13"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round" />
              </svg>
            </div>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>

<style>
  /* Fact-checker bubble tint — can't be expressed as static utilities. */
  .fc-bubble {
    background: color-mix(in srgb, var(--color) 15%, var(--color-surface-alt));
    border: 1px solid color-mix(in srgb, var(--color) 40%, transparent);
  }
</style>
