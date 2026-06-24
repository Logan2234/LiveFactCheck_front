<script lang="ts">
  import AudioControls from "$lib/components/features/audio/AudioControls.svelte";
  import FalseClaimAlert from "$lib/components/features/claims/FalseClaimAlert.svelte";
  import KeyboardShortcuts from "$lib/components/features/KeyboardShortcuts.svelte";
  import LayoutSelector from "$lib/components/features/LayoutSelector.svelte";
  import SettingsMenu from "$lib/components/features/SettingsMenu.svelte";
  import LayoutChat from "$lib/layouts/LayoutChat.svelte";
  import LayoutClassic from "$lib/layouts/LayoutClassic.svelte";
  import LayoutDashboard from "$lib/layouts/LayoutDashboard.svelte";
  import LayoutSpotlight from "$lib/layouts/LayoutSpotlight.svelte";
  import LayoutTable from "$lib/layouts/LayoutTable.svelte";
  import LayoutTerminal from "$lib/layouts/LayoutTerminal.svelte";
  import LayoutTicker from "$lib/layouts/LayoutTicker.svelte";
  import LayoutTimeline from "$lib/layouts/LayoutTimeline.svelte";
  import LayoutTrustMeter from "$lib/layouts/LayoutTrustMeter.svelte";
  import { notifyClaim } from "$lib/stores/alerts";
  import { appendTranscript, onAudioChunk } from "$lib/stores/audio";
  import { addOrUpdateClaim, removeClaim } from "$lib/stores/claims";
  import { activeLayout } from "$lib/stores/layout";
  import {
    connect,
    disconnect,
    onClaim,
    onRemoveClaim,
    onTranscript,
    sendAudioChunk
  } from "$lib/websocket";
  import WsToast from "$lib/components/ui/WsToast.svelte";
  import { wsStatus } from "$lib/websocket";
  import { onDestroy, onMount } from "svelte";
  import { fade } from "svelte/transition";

  const WS_DOT: Record<
    string,
    { color: string; label: string; pulse: boolean }
  > = {
    connected: { color: "#10b981", label: "Backend connecté", pulse: false },
    connecting: { color: "#f59e0b", label: "Connexion en cours…", pulse: true },
    error: { color: "#ef4444", label: "Backend injoignable", pulse: false },
    disconnected: {
      color: "var(--color-fg-faint)",
      label: "Déconnecté",
      pulse: false
    }
  };

  let dot = $derived(WS_DOT[$wsStatus] ?? WS_DOT.disconnected);

  onMount(() => {
    connect();
    onAudioChunk(sendAudioChunk);
    onClaim((claim) => {
      addOrUpdateClaim(claim);
      notifyClaim(claim);
    });
    onRemoveClaim(removeClaim);
    onTranscript(appendTranscript);
  });

  onDestroy(() => disconnect());
</script>

<svelte:head>
  <title>LiveFactChecker</title>
</svelte:head>

<KeyboardShortcuts />
<FalseClaimAlert />
<WsToast />

<!-- WS status dot — fixed top-right, title as tooltip -->
<span
  class="ws-dot fixed top-3 right-3 z-9500 h-2.5 w-2.5 rounded-full"
  class:ws-dot--pulse={dot.pulse}
  style="background: {dot.color};"
  title={dot.label}
  aria-hidden="true"></span>

<main class="mx-auto max-w-300 p-8">
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <!-- rec 02: structured logotype with pulsing live dot -->
    <div class="flex items-center gap-3">
      <span class="live-dot" aria-hidden="true"></span>
      <div>
        <h1
          class="m-0 font-display text-[2.2rem] font-extrabold leading-none tracking-tight uppercase">
          LFC
        </h1>
        <p class="m-0 text-[0.62rem] tracking-[0.22em] text-fg-faint uppercase">
          Live Fact Checker
        </p>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      <AudioControls />
      <div class="hidden h-6 w-px bg-edge md:block" aria-hidden="true"></div>
      <div class="flex items-center gap-2">
        <LayoutSelector />
        <SettingsMenu />
      </div>
    </div>
  </header>
  <!-- rec H: fade on layout switch so 9 very different layouts don't swap brutally -->
  {#key $activeLayout}
    <div in:fade={{ duration: 150 }}>
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
    </div>
  {/key}
</main>

<style>
  .live-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
    animation: dot-pulse 1.4s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.45;
      transform: scale(0.72);
    }
  }

  .ws-dot--pulse {
    animation: dot-pulse 1s ease-in-out infinite;
  }
</style>
