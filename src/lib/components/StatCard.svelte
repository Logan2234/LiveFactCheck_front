<script lang="ts">
  import type { Snippet } from "svelte";

  type DotColor = "green" | "amber" | "red" | "none";

  let {
    title,
    dot = "none",
    icon = "",
    accent = "",
    children
  }: {
    title: string;
    dot?: DotColor;
    icon?: string;
    accent?: string;
    children: Snippet;
  } = $props();

  const dotClass: Record<DotColor, string> = {
    green: "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]",
    amber: "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]",
    red: "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]",
    none: ""
  };
</script>

<div class="rounded-xl border border-edge bg-surface-alt px-4 py-4 {accent}">
  <div
    class="mb-3.5 flex items-center gap-2 border-b border-surface-raised pb-2.5 text-sm font-semibold text-fg">
    {#if icon}
      <span class="text-base leading-none">{icon}</span>
    {:else if dot !== "none"}
      <span class="h-2 w-2 shrink-0 rounded-full {dotClass[dot]}"></span>
    {/if}
    {title}
  </div>
  {@render children()}
</div>
