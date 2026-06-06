<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { connect, disconnect, sendAudioChunk, onClaim, onRemoveClaim, onTranscript } from "$lib/websocket";
  import { addOrUpdateClaim, removeClaim } from "$lib/stores/claims";
  import { onAudioChunk, appendTranscript } from "$lib/stores/audio";
  import { activeLayout, type Layout } from "$lib/stores/layout";
  import AudioControls from "$lib/components/AudioControls.svelte";
  import KeyboardShortcuts from "$lib/components/KeyboardShortcuts.svelte";
  import LayoutClassic from "$lib/layouts/LayoutClassic.svelte";
  import LayoutNewsroom from "$lib/layouts/LayoutNewsroom.svelte";
  import LayoutDashboard from "$lib/layouts/LayoutDashboard.svelte";
  import LayoutTerminal from "$lib/layouts/LayoutTerminal.svelte";
  import LayoutKanban from "$lib/layouts/LayoutKanban.svelte";
  import LayoutSpotlight from "$lib/layouts/LayoutSpotlight.svelte";
  import LayoutTable from "$lib/layouts/LayoutTable.svelte";
  import LayoutAnnotation from "$lib/layouts/LayoutAnnotation.svelte";
  import LayoutTrustMeter from "$lib/layouts/LayoutTrustMeter.svelte";
  import LayoutTicker from "$lib/layouts/LayoutTicker.svelte";
  import LayoutTimeline from "$lib/layouts/LayoutTimeline.svelte";
  import LayoutChat from "$lib/layouts/LayoutChat.svelte";
  import LayoutRadial from "$lib/layouts/LayoutRadial.svelte";

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
    { key: "newsroom", label: "Newsroom", icon: "📰" },
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "terminal", label: "Terminal", icon: ">" },
    { key: "kanban", label: "Kanban", icon: "▦" },
    { key: "spotlight", label: "Spotlight", icon: "◎" },
    { key: "table", label: "Table", icon: "≡" },
    { key: "annotation", label: "Annotation", icon: "✍" },
    { key: "trustmeter", label: "Trust Meter", icon: "🎯" },
    { key: "ticker", label: "Ticker", icon: "📺" },
    { key: "timeline", label: "Timeline", icon: "⏱" },
    { key: "chat", label: "Chat", icon: "💬" },
    { key: "radial", label: "Radial", icon: "🍩" },
  ];
</script>

<svelte:head>
  <title>LiveFactChecker</title>
</svelte:head>

<KeyboardShortcuts />

<main>
  <header>
    <div class="header-left">
      <h1>🔍 LiveFactChecker</h1>
      <p class="subtitle">Vérification de faits en temps réel</p>
    </div>
    <div class="header-right">
      <div class="layout-switcher">
        {#each layouts as l}
          <button
            class:active={$activeLayout === l.key}
            onclick={() => activeLayout.set(l.key)}
            title={l.label}
          >
            {l.icon} {l.label}
          </button>
        {/each}
      </div>
      <AudioControls />
    </div>
  </header>
  {#if $activeLayout === "classic"}
    <LayoutClassic />
  {:else if $activeLayout === "newsroom"}
    <LayoutNewsroom />
  {:else if $activeLayout === "dashboard"}
    <LayoutDashboard />
  {:else if $activeLayout === "terminal"}
    <LayoutTerminal />
  {:else if $activeLayout === "kanban"}
    <LayoutKanban />
  {:else if $activeLayout === "spotlight"}
    <LayoutSpotlight />
  {:else if $activeLayout === "annotation"}
    <LayoutAnnotation />
  {:else if $activeLayout === "trustmeter"}
    <LayoutTrustMeter />
  {:else if $activeLayout === "ticker"}
    <LayoutTicker />
  {:else if $activeLayout === "timeline"}
    <LayoutTimeline />
  {:else if $activeLayout === "chat"}
    <LayoutChat />
  {:else if $activeLayout === "radial"}
    <LayoutRadial />
  {:else}
    <LayoutTable />
  {/if}
</main>

<style>
  :global(body) {
    margin: 0;
    background: #121220;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  main {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1.5rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  h1 {
    font-size: 1.5rem;
    margin: 0;
  }

  .subtitle {
    color: #888;
    margin: 0.1rem 0 0;
    font-size: 0.85rem;
  }

  .header-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
  }

  .layout-switcher {
    display: flex;
    gap: 0.25rem;
  }

  .layout-switcher button {
    background: #1e1e2e;
    border: 1px solid #2e2e3e;
    color: #888;
    border-radius: 6px;
    padding: 0.3rem 0.65rem;
    font-size: 0.75rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .layout-switcher button:hover {
    border-color: #555;
    color: #ddd;
  }

  .layout-switcher button.active {
    background: #2e2e4e;
    border-color: #5555aa;
    color: #fff;
  }

</style>
