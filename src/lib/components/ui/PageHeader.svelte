<script lang="ts">
  import type { Snippet } from "svelte";

  // Admin page header in the broadcast-chyron language shared with the account
  // area (see AccountChyron): an accent tally bar, a condensed display title, an
  // optional subtitle (plain `subtitle` or rich via the default snippet) and a
  // right-aligned `actions` area.
  let {
    title,
    subtitle = "",
    actions,
    children
  }: {
    title: string;
    subtitle?: string;
    actions?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<header
  class="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-edge pb-5">
  <div class="flex items-stretch gap-3.5">
    <span class="w-1 shrink-0 rounded-full bg-accent" aria-hidden="true"></span>
    <div class="flex flex-col gap-1">
      <h1
        class="m-0 font-display text-3xl leading-none font-extrabold tracking-tight uppercase">
        {title}
      </h1>
      {#if children}
        <p class="m-0 mt-1 text-sm text-fg-muted">{@render children()}</p>
      {:else if subtitle}
        <p class="m-0 mt-1 text-sm text-fg-muted">{subtitle}</p>
      {/if}
    </div>
  </div>
  {#if actions}
    <div class="flex shrink-0 items-center gap-3">{@render actions()}</div>
  {/if}
</header>
