<script lang="ts">
  import Popover from "$lib/components/ui/Popover.svelte";
  import { activeLayout, type Layout } from "$lib/stores/layout";

  // Single source of truth for the available layouts (moved here from +page so
  // the header just drops in <LayoutSelector/>). The page renders the matching
  // view from $activeLayout.
  //
  // `icon` is the inner markup of a 24-viewBox line glyph (same flat stroke
  // style as ui/Icon.svelte) that DEPICTS the layout's structure — two columns,
  // a grid, a terminal prompt… Kept local because these are layout-specific and
  // single-use, not part of the shared admin-chrome icon set. Rendered at a
  // fixed 16px box so labels line up regardless of glyph, replacing the
  // variable-width emoji that made the menu rows shift.
  const LAYOUTS: { key: Layout; label: string; icon: string }[] = [
    {
      key: "classic",
      label: "Classic",
      icon: '<rect x="4" y="4" width="6.5" height="16" rx="1" /><rect x="13.5" y="4" width="6.5" height="16" rx="1" />'
    },
    {
      key: "dashboard",
      label: "Dashboard",
      icon: '<rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" /><rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />'
    },
    {
      key: "terminal",
      label: "Terminal",
      icon: '<rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M13 15h4" />'
    },
    {
      key: "spotlight",
      label: "Spotlight",
      icon: '<circle cx="12" cy="12" r="3.5" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" />'
    },
    {
      key: "table",
      label: "Table",
      icon: '<rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3 10h18M3 14.5h18M11 5v14" />'
    },
    {
      key: "trustmeter",
      label: "Trust Meter",
      icon: '<path d="M5 18a7 7 0 1 1 14 0" /><path d="M12 18l3.5-4" /><circle cx="12" cy="18" r="1" />'
    },
    {
      key: "ticker",
      label: "Ticker",
      icon: '<rect x="2.5" y="8.5" width="19" height="7" rx="1.5" /><path d="M6 12h7" />'
    },
    {
      key: "timeline",
      label: "Timeline",
      icon: '<path d="M6 3.5v17" /><circle cx="6" cy="8" r="1.8" /><circle cx="6" cy="15" r="1.8" /><path d="M10 8h9M10 15h6" />'
    },
    {
      key: "chat",
      label: "Chat",
      icon: '<path d="M20 11.5a7.5 7.5 0 0 1-10.9 6.7L4 20l1.3-4.1A7.5 7.5 0 1 1 20 11.5z" />'
    }
  ];

  const CHECK = '<path d="M5 12l4 4 10-10" />';

  const current = $derived(
    LAYOUTS.find((l) => l.key === $activeLayout) ?? LAYOUTS[0]
  );
</script>

{#snippet glyph(path: string, size: number)}
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html path}
  </svg>
{/snippet}

<Popover
  label="Disposition de l'affichage"
  panelRole="listbox"
  panelClass="w-52 p-1.5">
  {#snippet trigger({ toggle, open })}
    <button
      type="button"
      class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-surface-raised hover:text-fg"
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-label="Disposition de l'affichage"
      title={`Disposition : ${current.label}`}
      onclick={toggle}>
      {@render glyph(current.icon, 18)}
    </button>
  {/snippet}

  {#snippet children({ close })}
    <p
      class="px-2.5 pt-1 pb-2 text-2xs font-semibold tracking-wide text-fg-faint uppercase">
      Disposition
    </p>
    {#each LAYOUTS as l (l.key)}
      {@const selected = $activeLayout === l.key}
      <button
        type="button"
        role="option"
        aria-selected={selected}
        class={[
          "flex w-full cursor-pointer items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors",
          selected
            ? "bg-surface-selected text-fg"
            : "text-fg-muted hover:bg-surface hover:text-fg"
        ]}
        onclick={() => {
          activeLayout.set(l.key);
          close();
        }}>
        <span class="flex items-center gap-2.5">
          <span class={selected ? "text-accent" : "text-fg-faint"}>
            {@render glyph(l.icon, 16)}
          </span>
          <span class="font-medium">{l.label}</span>
        </span>
        {#if selected}
          <span class="text-accent">{@render glyph(CHECK, 14)}</span>
        {/if}
      </button>
    {/each}
  {/snippet}
</Popover>
