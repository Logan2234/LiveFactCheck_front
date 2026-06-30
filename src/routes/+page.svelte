<script lang="ts">
  import AccountButton from "$lib/components/features/AccountButton.svelte";
  import AudioControls from "$lib/components/features/audio/AudioControls.svelte";
  import FalseClaimAlert from "$lib/components/features/claims/FalseClaimAlert.svelte";
  import KeyboardShortcuts from "$lib/components/features/KeyboardShortcuts.svelte";
  import LayoutSelector from "$lib/components/features/LayoutSelector.svelte";
  import SettingsMenu from "$lib/components/features/SettingsMenu.svelte";
  import LayoutClassic from "$lib/layouts/LayoutClassic.svelte";
  import LayoutDashboard from "$lib/layouts/LayoutDashboard.svelte";
  import LayoutSpotlight from "$lib/layouts/LayoutSpotlight.svelte";
  import LayoutTicker from "$lib/layouts/LayoutTicker.svelte";
  import LayoutTrustMeter from "$lib/layouts/LayoutTrustMeter.svelte";
  import { notifyClaim } from "$lib/stores/alerts";
  import {
    appendTranscript,
    onAudioChunk,
    recordingState
  } from "$lib/stores/audio";
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
  import { fade } from "svelte/transition";

  let recording = $derived($recordingState === "recording");

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

<main class="mx-auto max-w-300 px-8 pb-8">
  <!-- Sticky console strip: identity on the left, controls on the right. When
       recording, the strip's edge goes accent-red — an on-air cue without a
       separate banner. -->
  <header
    class={[
      "sticky top-0 z-40 -mx-8 mb-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 border-b px-8 py-4 backdrop-blur transition-colors duration-300",
      recording ? "border-accent/60" : "border-edge"
    ]}
    style="background: color-mix(in srgb, var(--color-background) 88%, transparent);">
    <div class="flex items-center gap-3.5">
      <div class="flex items-center gap-3">
        <span class="live-dot" aria-hidden="true"></span>
        <div>
          <h1
            class="m-0 font-display text-[2.2rem] font-extrabold leading-none tracking-tight uppercase">
            LFC
          </h1>
          <p
            class="m-0 text-[0.62rem] tracking-[0.22em] text-fg-faint uppercase">
            Live Fact Checker
          </p>
        </div>
      </div>
    </div>
    <div class="flex flex-wrap items-center justify-end gap-x-3 gap-y-2">
      <AudioControls />
      <!-- View / settings / account collapse into one segmented control with
           hairline dividers, so the secondary chrome reads as a single quiet
           cluster instead of three competing pills. -->
      <div
        class="flex items-center rounded-full border border-edge bg-surface"
        role="group"
        aria-label="Affichage, réglages et compte">
        <LayoutSelector />
        <span class="h-5 w-px bg-edge" aria-hidden="true"></span>
        <SettingsMenu />
        <span class="h-5 w-px bg-edge" aria-hidden="true"></span>
        <AccountButton />
      </div>
    </div>
  </header>

  {#key $activeLayout}
    <div in:fade={{ duration: 150 }}>
      {#if $activeLayout === "classic"}
        <LayoutClassic />
      {:else if $activeLayout === "dashboard"}
        <LayoutDashboard />
      {:else if $activeLayout === "spotlight"}
        <LayoutSpotlight />
      {:else if $activeLayout === "trustmeter"}
        <LayoutTrustMeter />
      {:else if $activeLayout === "ticker"}
        <LayoutTicker />
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
</style>
