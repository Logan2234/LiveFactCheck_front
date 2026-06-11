<script lang="ts">
  type Color = "green" | "amber" | "red" | "gray";

  let { color, label }: { color: Color; label: string } = $props();

  const colorClass: Record<Color, string> = {
    green: "border-green-500/25 bg-green-500/12 text-green-400",
    amber: "border-amber-500/25 bg-amber-500/12 text-amber-400",
    red: "border-red-500/25 bg-red-500/12 text-red-400",
    gray: "border-surface-selected bg-surface-raised text-fg-faint"
  };
</script>

<span
  class="rounded-full border px-2 py-0.5 text-2xs font-medium whitespace-nowrap {colorClass[
    color
  ]}">
  {label}
</span>
