<script lang="ts">
  import type { Snippet } from "svelte";

  // Shared dropdown/popover behaviour: open state, toggle, close on
  // outside-click and Escape, and the floating panel container. Callers supply
  // the trigger and the panel content as snippets; what goes inside (a listbox,
  // a combobox, a settings form) is their concern.
  let {
    open = $bindable(false),
    label,
    panelRole = "dialog",
    full = false,
    panelClass = "",
    trigger,
    children
  }: {
    open?: boolean;
    /** aria-label for the floating panel. */
    label?: string;
    panelRole?: "dialog" | "listbox";
    /** Stretch the wrapper and panel to the container width. */
    full?: boolean;
    /** Extra classes for the panel (width, padding…). */
    panelClass?: string;
    trigger: Snippet<[{ toggle: () => void; open: boolean }]>;
    children: Snippet<[{ close: () => void }]>;
  } = $props();

  let root: HTMLDivElement;

  function toggle() {
    open = !open;
  }
  function close() {
    open = false;
  }

  function onWindowClick(e: MouseEvent) {
    if (open && root && !root.contains(e.target as Node)) open = false;
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) open = false;
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class={["relative", full && "w-full"]} bind:this={root}>
  {@render trigger({ toggle, open })}

  {#if open}
    <div
      class={[
        "absolute z-20 mt-1 rounded-xl border border-edge bg-surface-raised shadow-lg",
        full ? "right-0 left-0" : "right-0",
        panelClass
      ]}
      role={panelRole}
      aria-label={label}>
      {@render children({ close })}
    </div>
  {/if}
</div>
