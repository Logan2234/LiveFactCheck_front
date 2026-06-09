<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    open = $bindable(false),
    title = "",
    maxWidth = "380px",
    closeOnBackdrop = true,
    onClose,
    children
  }: {
    open?: boolean;
    title?: string;
    maxWidth?: string;
    closeOnBackdrop?: boolean;
    onClose?: () => void;
    children?: Snippet;
  } = $props();

  function close() {
    open = false;
    onClose?.();
  }

  // Close on Escape while the modal is open (capture-phase so it wins over
  // app-level Escape handlers, and stops them from also firing).
  function onKeydown(e: KeyboardEvent) {
    if (open && e.key === "Escape") {
      e.preventDefault();
      e.stopPropagation();
      close();
    }
  }
</script>

<svelte:window onkeydowncapture={onKeydown} />

{#if open}
  <div
    class="anim-fade fixed inset-0 z-9500 flex items-center justify-center bg-[rgba(10,10,18,0.6)] backdrop-blur-[3px]">
    <button
      class="absolute inset-0 m-0 h-full w-full cursor-default bg-transparent p-0"
      aria-label="Fermer"
      onclick={closeOnBackdrop ? close : undefined}></button>
    <div
      class="anim-pop relative m-6 w-full rounded-[14px] border border-edge bg-surface-alt p-6 shadow-[0_24px_60px_rgba(0,0,0,0.55)]"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Fenêtre modale"}
      tabindex="-1"
      style="max-width: {maxWidth}">
      {#if title}
        <div class="mb-4 flex items-center justify-between">
          <h2 class="m-0 text-base">{title}</h2>
          <button
            class="cursor-pointer px-1 py-0 text-2xl leading-none text-zinc-500 transition-colors duration-150 hover:text-white"
            onclick={close}
            aria-label="Fermer">×</button>
        </div>
      {/if}
      <div>
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  /* Modal enter animations — keyframes can't be expressed as utilities. */
  .anim-fade {
    animation: fade-in 0.12s ease-out;
  }

  .anim-pop {
    animation: pop-in 0.14s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes pop-in {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(6px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
</style>
