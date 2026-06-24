<script lang="ts">
  import type { Snippet } from "svelte";

  // Compact metric tile: a faint label above an emphasised value. Distinct from
  // StatCard (a titled panel with free content) — here the value is the focus.
  // Pass `value` for the common case, or a `children` snippet for a custom value.
  let {
    label,
    value,
    children
  }: {
    label: string;
    value?: string | number;
    children?: Snippet;
  } = $props();
</script>

<div
  class="flex flex-col gap-1 rounded-xl border border-edge bg-surface-alt px-4 py-2.5">
  <span class="text-2xs text-fg-faint">{label}</span>
  {#if children}
    {@render children()}
  {:else}
    <span class="text-base font-semibold text-fg">{value}</span>
  {/if}
</div>
