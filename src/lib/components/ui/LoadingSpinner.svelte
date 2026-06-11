<script lang="ts">
  let { message = "Chargement…" }: { message?: string } = $props();
</script>

<div class="flex items-center gap-3 text-sm text-fg-muted">
  <span
    class="spinner inline-block h-4 w-4 shrink-0 rounded-full border-2 border-edge-hi border-t-accent-light"
  ></span>
  {message}
</div>
