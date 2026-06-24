<script lang="ts">
  // Dashed placeholder shown when a list/section has no content.
  //  - "section": large standalone placeholder (terminal surface, faint text).
  //  - "result":  compact "no results" notice inside a result area.
  type Variant = "section" | "result";

  let {
    message,
    icon = "",
    variant = "section"
  }: { message: string; icon?: string; variant?: Variant } = $props();

  const variantClass: Record<Variant, string> = {
    section: "px-4 py-12 bg-surface-term text-fg-faint",
    result: "p-5 bg-surface-alt text-fg-muted"
  };
</script>

<div
  class="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-edge text-center text-sm {variantClass[
    variant
  ]}">
  {#if icon}
    <span class="text-3xl">{icon}</span>
  {/if}
  <span>{message}</span>
</div>
