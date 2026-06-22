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
  import { onDestroy, onMount } from "svelte";

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

<main class="mx-auto max-w-300 p-8">
  <header class="mb-6 flex flex-wrap items-center justify-between gap-4">
    <div>
      <h1 class="m-0 text-2xl">🔍 LiveFactChecker</h1>
      <p class="mt-0.5 mb-0 text-sm text-fg-muted">
        Vérification de faits en temps réel
      </p>
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
