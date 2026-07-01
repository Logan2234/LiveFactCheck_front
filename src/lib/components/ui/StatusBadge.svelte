<script lang="ts">
  type Color = "green" | "amber" | "red" | "gray";

  let { color, label }: { color: Color; label: string } = $props();

  const colorClass: Record<Color, string> = {
    green:
      "border-green-600/30 bg-green-500/15 text-green-700 dark:border-green-500/25 dark:bg-green-500/12 dark:text-green-400",
    amber:
      "border-amber-600/30 bg-amber-500/15 text-amber-700 dark:border-amber-500/25 dark:bg-amber-500/12 dark:text-amber-400",
    red: "border-red-600/30 bg-red-500/15 text-red-700 dark:border-red-500/25 dark:bg-red-500/12 dark:text-red-400",
    gray: "border-surface-selected bg-surface-raised text-fg-faint"
  };
</script>

<span
  class="rounded-full border px-2 py-0.5 text-2xs font-medium whitespace-nowrap {colorClass[
    color
  ]}">
  {label}
</span>
