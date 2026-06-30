<script lang="ts">
  import { resolve } from "$app/paths";
  import type { StaticRouteId } from "$lib/utils/navigation";

  // The LFC lockup for back-office chrome: a pulsing live dot + the condensed
  // "LFC" wordmark + a context label (ADMIN / MON ESPACE / …). Replaces the
  // stray 🔍 emoji so the rails, login and account card all read as one product.
  let {
    label,
    href,
    size = "md"
  }: {
    label: string;
    href?: StaticRouteId;
    size?: "sm" | "md";
  } = $props();

  const wordmark = $derived(size === "sm" ? "text-xl" : "text-2xl");
</script>

{#snippet lockup()}
  <span class="live-dot" aria-hidden="true"></span>
  <span class="flex flex-col leading-[1.05]">
    <span
      class="font-display {wordmark} font-extrabold tracking-tight text-fg uppercase">
      LFC
    </span>
    <span
      class="text-2xs font-semibold tracking-[0.2em] text-accent-light uppercase">
      {label}
    </span>
  </span>
{/snippet}

{#if href}
  <a
    href={resolve(href)}
    class="flex items-center gap-2.5 no-underline outline-none focus-visible:opacity-80">
    {@render lockup()}
  </a>
{:else}
  <span class="flex items-center gap-2.5">
    {@render lockup()}
  </span>
{/if}

<style>
  .live-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
    box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-accent) 60%, transparent);
    animation: dot-pulse 1.6s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.72);
    }
  }
</style>
