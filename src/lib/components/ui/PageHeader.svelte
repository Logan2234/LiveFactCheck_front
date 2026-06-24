<script lang="ts">
  import type { Snippet } from "svelte";

  // Page title block shared by the admin pages: emoji + title, an optional
  // subtitle (plain `subtitle` prop, or rich markup via the default snippet),
  // and an optional `actions` area aligned to the right.
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

<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
  <div>
    <h1 class="mt-0 mb-1 text-2xl">{title}</h1>
    {#if children}
      <p class="m-0 text-sm text-fg-muted">{@render children()}</p>
    {:else if subtitle}
      <p class="m-0 text-sm text-fg-muted">{subtitle}</p>
    {/if}
  </div>
  {#if actions}
    <div class="flex shrink-0 items-center gap-3">{@render actions()}</div>
  {/if}
</header>
