<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    subtitle,
    actions
  }: {
    title: string;
    subtitle?: Snippet;
    actions?: Snippet;
  } = $props();
</script>

<header
  class="border-edge mb-8 flex flex-wrap items-end justify-between gap-4 border-b pb-5">
  <div class="flex items-stretch gap-3.5">
    <span class="bg-accent w-1 shrink-0 rounded-full" aria-hidden="true"></span>
    <div class="flex flex-col gap-1">
      <h1
        class="font-display m-0 text-3xl leading-none font-extrabold tracking-tight uppercase">
        {title}
      </h1>
      {#if subtitle}
        <p class="text-fg-muted m-0 mt-1 text-sm">{@render subtitle()}</p>
      {/if}
    </div>
  </div>
  {#if actions}
    <div class="flex items-center gap-2">{@render actions()}</div>
  {/if}
</header>
