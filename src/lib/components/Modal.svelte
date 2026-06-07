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
  <div class="overlay">
    <button
      class="backdrop"
      aria-label="Fermer"
      onclick={closeOnBackdrop ? close : undefined}></button>
    <div
      class="modal"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Fenêtre modale"}
      tabindex="-1"
      style="max-width: {maxWidth}">
      {#if title}
        <div class="modal-head">
          <h2>{title}</h2>
          <button class="close" onclick={close} aria-label="Fermer">×</button>
        </div>
      {/if}
      <div class="modal-body">
        {@render children?.()}
      </div>
    </div>
  </div>
{/if}

<style>
  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(10, 10, 18, 0.6);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9500;
    animation: fade-in 0.12s ease-out;
  }

  @keyframes fade-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  .backdrop {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    background: transparent;
    border: none;
    padding: 0;
    margin: 0;
    cursor: default;
  }

  .modal {
    position: relative;
    width: 100%;
    margin: 1.5rem;
    background: #1a1a2a;
    border: 1px solid #2e2e3e;
    border-radius: 14px;
    padding: 1.4rem;
    box-shadow: 0 24px 60px rgba(0, 0, 0, 0.55);
    animation: pop-in 0.14s ease-out;
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

  .modal-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }

  .modal-head h2 {
    font-size: 1rem;
    margin: 0;
  }

  .close {
    background: none;
    border: none;
    color: #777;
    font-size: 1.4rem;
    line-height: 1;
    cursor: pointer;
    padding: 0 0.2rem;
    transition: color 0.15s;
  }

  .close:hover {
    color: #fff;
  }
</style>
