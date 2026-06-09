<script lang="ts">
  let { message }: { message: string } = $props();
</script>

<p
  class="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-3.5 py-3 text-sm text-red-300"
  role="alert"
>
  {message}
</p>
