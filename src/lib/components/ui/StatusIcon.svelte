<script lang="ts">
  import { STATUS_COLOR } from "$lib/constants/status";
  import type { VerificationStatus } from "$lib/stores/claims";

  let { status, size = 16 }: { status: VerificationStatus; size?: number } =
    $props();

  const color = $derived(STATUS_COLOR[status]);
</script>

{#if status === "verified"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style="flex-shrink:0;display:inline-block;vertical-align:middle;">
    <circle cx="8" cy="8" r="6.5" stroke={color} stroke-width="1.5" />
    <polyline
      points="4.5,8.5 7,11 11.5,5"
      stroke={color}
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round" />
  </svg>
{:else if status === "false"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style="flex-shrink:0;display:inline-block;vertical-align:middle;">
    <circle cx="8" cy="8" r="6.5" stroke={color} stroke-width="1.5" />
    <line
      x1="5.5"
      y1="5.5"
      x2="10.5"
      y2="10.5"
      stroke={color}
      stroke-width="1.8"
      stroke-linecap="round" />
    <line
      x1="10.5"
      y1="5.5"
      x2="5.5"
      y2="10.5"
      stroke={color}
      stroke-width="1.8"
      stroke-linecap="round" />
  </svg>
{:else if status === "pending"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style="flex-shrink:0;display:inline-block;vertical-align:middle;"
    class="pending-ring">
    <circle
      cx="8"
      cy="8"
      r="6.5"
      stroke={color}
      stroke-width="1.5"
      stroke-dasharray="3.5 2" />
    <circle cx="8" cy="8" r="2.8" fill={color} class="pending-dot" />
  </svg>
{:else if status === "uncertain"}
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style="flex-shrink:0;display:inline-block;vertical-align:middle;">
    <circle cx="8" cy="8" r="6.5" stroke={color} stroke-width="1.5" />
    <path
      d="M5.5 6.5C5.5 5 6.6 4 8 4C9.4 4 10.5 5 10.5 6.5C10.5 7.6 9.5 8.5 8 9.5"
      stroke={color}
      stroke-width="1.6"
      stroke-linecap="round" />
    <circle cx="8" cy="12" r="0.9" fill={color} />
  </svg>
{:else}
  <!-- unverifiable -->
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    aria-hidden="true"
    style="flex-shrink:0;display:inline-block;vertical-align:middle;">
    <circle
      cx="8"
      cy="8"
      r="6.5"
      stroke={color}
      stroke-width="1.5"
      stroke-dasharray="2 2" />
    <line
      x1="5"
      y1="8"
      x2="11"
      y2="8"
      stroke={color}
      stroke-width="2"
      stroke-linecap="round" />
  </svg>
{/if}

<style>
  .pending-ring {
    transform-box: fill-box;
    transform-origin: center;
    animation: spin-pending 3s linear infinite;
  }

  .pending-dot {
    animation: pulse-pending 1.2s ease-in-out infinite;
  }

  @keyframes spin-pending {
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse-pending {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.3;
    }
  }
</style>
