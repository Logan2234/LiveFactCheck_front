<script lang="ts">
  import {
    STATUS_COLOR,
    STATUS_META,
    STATUS_ORDER
  } from "$lib/constants/status";
  import { transcriptEntries } from "$lib/stores/audio";
  import {
    claimFilter,
    claims,
    claimStats,
    type Claim,
    type ClaimFilter
  } from "$lib/stores/claims";
  import { formatDate, formatTime } from "$lib/utils/format";
  import { derived } from "svelte/store";

  type LogItem =
    | { kind: "transcript"; timestamp: number; text: string }
    | { kind: "claim"; timestamp: number; claim: Claim };

  const STATUS_SYM: Record<string, string> = {
    pending: "⋯",
    verified: "✓",
    false: "✗",
    uncertain: "?",
    unverifiable: "~"
  };

  const log = derived(
    [transcriptEntries, claims, claimFilter],
    ([$t, $c, $filter]) => {
      const fc =
        $filter === "all" ? $c : $c.filter((c) => c.status === $filter);
      const items: LogItem[] = [
        ...$t.map((e) => ({
          kind: "transcript" as const,
          timestamp: e.timestamp,
          text: e.text
        })),
        ...fc.map((c) => ({
          kind: "claim" as const,
          timestamp: c.timestamp,
          claim: c
        }))
      ];
      return items.sort((a, b) => b.timestamp - a.timestamp);
    }
  );

  const filterKeys: { key: ClaimFilter; label: string }[] = [
    { key: "all", label: "all" },
    { key: "verified", label: "ok" },
    { key: "false", label: "ko" },
    { key: "pending", label: "..." },
    { key: "uncertain", label: "unk" },
    { key: "unverifiable", label: "n/a" }
  ];
</script>

<div
  class="overflow-hidden rounded-lg border border-surface bg-surface-term font-term">
  <div
    class="flex flex-wrap items-center justify-between gap-2 border-b border-surface bg-surface-term-bar px-4 py-2">
    <span class="flex gap-3 text-sm font-semibold">
      {#each STATUS_ORDER as s (s)}
        <span style="color: {STATUS_META[s].color}"
          >{$claimStats[s]}{STATUS_SYM[s]}</span>
      {/each}
    </span>
    <span class="flex gap-0.5">
      {#each filterKeys as { key, label } (key)}
        <button
          class={[
            "cursor-pointer px-1 py-0.5 font-[inherit] text-sm transition-colors duration-100",
            $claimFilter === key
              ? "text-accent-light"
              : "text-fg-muted hover:text-fg"
          ]}
          onclick={() => claimFilter.set(key)}>
          [{label}]
        </button>
      {/each}
    </span>
  </div>

  <div
    class="flex max-h-[calc(100vh-260px)] flex-col gap-1.5 overflow-y-auto px-4 py-3">
    {#if $log.length === 0}
      <div class="flex items-baseline gap-3 text-sm leading-normal">
        <span
          class="shrink-0 text-xs whitespace-nowrap tabular-nums text-fg-faint"
          >{formatDate(new Date())}</span>
        <span class="w-[1ch] shrink-0 text-center font-bold text-fg-faint"
          >_</span>
        <span class="flex-1 wrap-break-word text-fg-muted italic"
          >waiting for audio input...</span>
      </div>
    {:else}
      {#each $log as item (item.kind + "-" + (item.kind === "claim" ? item.claim.id : item.timestamp))}
        {#if item.kind === "transcript"}
          <div class="flex items-baseline gap-3 text-sm leading-normal">
            <span
              class="shrink-0 text-xs whitespace-nowrap tabular-nums text-fg-faint"
              >{formatTime(item.timestamp)}</span>
            <span class="w-[1ch] shrink-0 text-center font-bold text-fg-faint"
              >»</span>
            <span class="flex-1 wrap-break-word text-fg-muted italic"
              >{item.text}</span>
          </div>
        {:else}
          <div
            class="flex items-baseline gap-3 text-sm leading-normal"
            style="--sc: {STATUS_COLOR[item.claim.status] ?? '#888'}">
            <span
              class="shrink-0 text-xs whitespace-nowrap tabular-nums text-fg-faint"
              >{formatTime(item.timestamp)}</span>
            <span
              class="w-[1ch] shrink-0 text-center font-bold"
              style="color: var(--sc)"
              >{STATUS_SYM[item.claim.status] ?? "?"}</span>
            <span class="flex-1 wrap-break-word text-fg">
              <span class="font-medium" style="color: var(--sc)"
                >"{item.claim.text}"</span>
              {#if item.claim.explanation}
                <span class="text-sm text-fg-muted">
                  — {item.claim.explanation}</span>
              {/if}
            </span>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>
