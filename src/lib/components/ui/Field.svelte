<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    label,
    strong = false,
    children
  }: { label: string; strong?: boolean; children: Snippet } = $props();
</script>

<div class="flex min-w-0 items-center justify-between gap-2">
  <dt class="shrink-0 text-xs text-fg-faint">{label}</dt>
  <dd
    class="m-0 flex flex-wrap items-center justify-end gap-1.5 text-right text-sm {strong
      ? 'font-semibold text-fg'
      : 'text-fg-muted'}">
    {@render children()}
  </dd>
</div>
