<script lang="ts">
  import { wsStatus } from "$lib/websocket";
  import { fly } from "svelte/transition";

  type Toast = { id: number; msg: string; kind: "ok" | "err" };

  let toasts = $state<Toast[]>([]);
  let counter = 0;

  function push(msg: string, kind: Toast["kind"]) {
    const id = ++counter;
    toasts = [...toasts, { id, msg, kind }];
    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
    }, 3000);
  }

  // Track previous status without making it reactive (plain let, not $state)
  // so the effect only re-runs on wsStatus changes, not on prevStatus writes.
  let prevStatus = "";

  $effect(() => {
    const status = $wsStatus;
    if (!prevStatus) {
      prevStatus = status;
      return;
    }
    if (status === prevStatus) return;
    if (status === "connected") push("Backend connecté", "ok");
    else if (status === "error") push("Backend injoignable", "err");
    else if (status === "disconnected" && prevStatus === "connected")
      push("Connexion perdue — reconnexion...", "err");
    prevStatus = status;
  });
</script>

{#if toasts.length > 0}
  <div
    class="pointer-events-none fixed right-4 bottom-4 z-[9400] flex flex-col items-end gap-2">
    {#each toasts as toast (toast.id)}
      <div
        class={[
          "pointer-events-auto flex items-center gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm shadow-lg backdrop-blur",
          toast.kind === "ok"
            ? "border-emerald-500/30 bg-emerald-500/12 text-emerald-300"
            : "border-accent/30 bg-accent/10 text-accent-light"
        ]}
        in:fly={{ x: 14, duration: 200 }}
        out:fly={{ x: 14, duration: 150 }}
        role="status"
        aria-live="polite">
        <span
          class={[
            "h-2 w-2 shrink-0 rounded-full",
            toast.kind === "ok" ? "bg-emerald-400" : "bg-accent"
          ]}></span>
        {toast.msg}
      </div>
    {/each}
  </div>
{/if}
