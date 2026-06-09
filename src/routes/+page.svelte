<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import {
    connect,
    disconnect,
    sendAudioChunk,
    onClaim,
    onRemoveClaim,
    onTranscript
  } from "$lib/websocket";
  import { addOrUpdateClaim, removeClaim } from "$lib/stores/claims";
  import { onAudioChunk, appendTranscript } from "$lib/stores/audio";
  import { activeLayout, type Layout } from "$lib/stores/layout";
  import AudioControls from "$lib/components/AudioControls.svelte";
  import KeyboardShortcuts from "$lib/components/KeyboardShortcuts.svelte";
  import LayoutClassic from "$lib/layouts/LayoutClassic.svelte";
  import LayoutDashboard from "$lib/layouts/LayoutDashboard.svelte";
  import LayoutTerminal from "$lib/layouts/LayoutTerminal.svelte";
  import LayoutSpotlight from "$lib/layouts/LayoutSpotlight.svelte";
  import LayoutTable from "$lib/layouts/LayoutTable.svelte";
  import LayoutTrustMeter from "$lib/layouts/LayoutTrustMeter.svelte";
  import LayoutTicker from "$lib/layouts/LayoutTicker.svelte";
  import LayoutTimeline from "$lib/layouts/LayoutTimeline.svelte";
  import LayoutChat from "$lib/layouts/LayoutChat.svelte";

  onMount(() => {
    connect();
    onAudioChunk(sendAudioChunk);
    onClaim(addOrUpdateClaim);
    onRemoveClaim(removeClaim);
    onTranscript(appendTranscript);
  });

  onDestroy(() => disconnect());

  const layouts: { key: Layout; label: string; icon: string }[] = [
    { key: "classic", label: "Classic", icon: "⊞" },
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "terminal", label: "Terminal", icon: ">" },
    { key: "spotlight", label: "Spotlight", icon: "◎" },
    { key: "table", label: "Table", icon: "≡" },
    { key: "trustmeter", label: "Trust Meter", icon: "🎯" },
    { key: "ticker", label: "Ticker", icon: "📺" },
    { key: "timeline", label: "Timeline", icon: "⏱" },
    { key: "chat", label: "Chat", icon: "💬" }
  ];
</script>

<svelte:head>
  <title>LiveFactChecker</title>
</svelte:head>

<KeyboardShortcuts />

<main class="mx-auto max-w-300 p-8">
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="m-0 text-2xl">🔍 LiveFactChecker</h1>
      <p class="mt-0.5 mb-0 text-sm text-zinc-500">
        Vérification de faits en temps réel
      </p>
    </div>
    <div class="flex flex-col items-end gap-2">
      <div class="flex gap-1">
        {#each layouts as l}
          <button
            class={[
              "cursor-pointer rounded-md border px-2.5 py-1.5 text-xs transition-all duration-150",
              $activeLayout === l.key
                ? "border-accent-dim bg-surface-selected text-white"
                : "border-edge bg-surface text-zinc-500 hover:border-zinc-600 hover:text-zinc-200"
            ]}
            onclick={() => activeLayout.set(l.key)}
            title={l.label}>
            {l.icon}
            {l.label}
          </button>
        {/each}
      </div>
      <AudioControls />
    </div>
  </header>
  {#if $activeLayout === "classic"}
    <LayoutClassic />
  {:else if $activeLayout === "dashboard"}
    <LayoutDashboard />
  {:else if $activeLayout === "terminal"}
    <LayoutTerminal />
  {:else if $activeLayout === "spotlight"}
    <LayoutSpotlight />
  {:else if $activeLayout === "trustmeter"}
    <LayoutTrustMeter />
  {:else if $activeLayout === "ticker"}
    <LayoutTicker />
  {:else if $activeLayout === "timeline"}
    <LayoutTimeline />
  {:else if $activeLayout === "chat"}
    <LayoutChat />
  {:else}
    <LayoutTable />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--color-background);
    color: var(--color-fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
</style>
