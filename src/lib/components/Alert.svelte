<script lang="ts">
  let {
    message,
    type = "info",
    class: extraClass
  }: {
    message: string;
    type: "error" | "warning" | "info";
    class?: string;
  } = $props();

  const baseClass = "mb-4 rounded-lg px-3.5 py-3 text-sm";

  const typeClass = {
    error: "border border-red-500/35 bg-red-500/10 text-red-300",
    warning: "border border-amber-500/35 bg-amber-500/10 text-amber-300",
    info: "border border-blue-500/35 bg-blue-500/10 text-blue-300"
  };
</script>

<p class={`${baseClass} ${typeClass[type]} ${extraClass}`} role="alert">
  {message}
</p>
