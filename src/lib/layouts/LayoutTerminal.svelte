<script lang="ts">
  import { transcriptEntries } from "$lib/stores/audio";
  import {
    claimFilter,
    claims,
    claimStats,
    type Claim,
    type ClaimFilter
  } from "$lib/stores/claims";
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

  const STATUS_COLOR: Record<string, string> = {
    pending: "#f59e0b",
    verified: "#10b981",
    false: "#ef4444",
    uncertain: "#6b7280",
    unverifiable: "#8b5cf6"
  };

  const log = derived([transcriptEntries, claims, claimFilter], ([$t, $c, $filter]) => {
    const fc = $filter === "all" ? $c : $c.filter((c) => c.status === $filter);
    const items: LogItem[] = [
      ...$t.map((e) => ({ kind: "transcript" as const, timestamp: e.timestamp, text: e.text })),
      ...fc.map((c) => ({ kind: "claim" as const, timestamp: c.timestamp, claim: c }))
    ];
    return items.sort((a, b) => b.timestamp - a.timestamp);
  });

  const filterKeys: { key: ClaimFilter; label: string }[] = [
    { key: "all", label: "all" },
    { key: "verified", label: "ok" },
    { key: "false", label: "ko" },
    { key: "pending", label: "..." },
    { key: "uncertain", label: "unk" },
    { key: "unverifiable", label: "n/a" }
  ];
</script>

<div class="overflow-hidden rounded-lg border border-surface bg-[#0d0d0f] font-term">
  <div
    class="flex flex-wrap items-center justify-between gap-2 border-b border-surface bg-[#111118] px-4 py-2">
    <span class="flex gap-3 text-sm font-semibold">
      <span class="text-emerald-500">{$claimStats.verified}✓</span>
      <span class="text-red-500">{$claimStats.false}✗</span>
      <span class="text-amber-500">{$claimStats.pending}…</span>
      <span class="text-gray-500">{$claimStats.uncertain}?</span>
      <span class="text-violet-500">{$claimStats.unverifiable}~</span>
    </span>
    <span class="flex gap-0.5">
      {#each filterKeys as { key, label } (key)}
        <button
          class={[
            "cursor-pointer px-1 py-0.5 font-[inherit] text-sm transition-colors duration-100",
            $claimFilter === key ? "text-accent-light" : "text-zinc-600 hover:text-zinc-400"
          ]}
          onclick={() => claimFilter.set(key)}>
          [{label}]
        </button>
      {/each}
    </span>
  </div>

  <div class="flex max-h-[calc(100vh-260px)] flex-col gap-1.5 overflow-y-auto px-4 py-3">
    {#if $log.length === 0}
      <div class="flex items-baseline gap-3 text-sm leading-normal">
        <span class="shrink-0 text-xs whitespace-nowrap tabular-nums text-zinc-800"
          >{new Date().toLocaleTimeString()}</span>
        <span class="w-[1ch] shrink-0 text-center font-bold text-zinc-800">_</span>
        <span class="flex-1 wrap-break-word text-zinc-700 italic">waiting for audio input...</span>
      </div>
    {:else}
      {#each $log as item (item.kind + "-" + (item.kind === "claim" ? item.claim.id : item.timestamp))}
        {#if item.kind === "transcript"}
          <div class="flex items-baseline gap-3 text-sm leading-normal">
            <span class="shrink-0 text-xs whitespace-nowrap tabular-nums text-zinc-800"
              >{new Date(item.timestamp).toLocaleTimeString()}</span>
            <span class="w-[1ch] shrink-0 text-center font-bold text-zinc-800">»</span>
            <span class="flex-1 wrap-break-word text-zinc-700 italic">{item.text}</span>
          </div>
        {:else}
          <div
            class="flex items-baseline gap-3 text-sm leading-normal"
            style="--sc: {STATUS_COLOR[item.claim.status] ?? '#888'}">
            <span class="shrink-0 text-xs whitespace-nowrap tabular-nums text-zinc-800"
              >{new Date(item.timestamp).toLocaleTimeString()}</span>
            <span class="w-[1ch] shrink-0 text-center font-bold" style="color: var(--sc)"
              >{STATUS_SYM[item.claim.status] ?? "?"}</span>
            <span class="flex-1 wrap-break-word text-zinc-500">
              <span class="font-medium" style="color: var(--sc)">"{item.claim.text}"</span>
              {#if item.claim.explanation}
                <span class="text-sm text-zinc-600"> — {item.claim.explanation}</span>
              {/if}
            </span>
          </div>
        {/if}
      {/each}
    {/if}
  </div>
</div>
