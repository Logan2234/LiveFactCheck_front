<script lang="ts">
  import Popover from "$lib/components/ui/Popover.svelte";
  import { activeLayout, type Layout } from "$lib/stores/layout";

  // Single source of truth for the available layouts (moved here from +page so
  // the header just drops in <LayoutSelector/>). The page renders the matching
  // view from $activeLayout.
  const LAYOUTS: { key: Layout; label: string; icon: string }[] = [
    { key: "classic", label: "Classic", icon: "⊞" },
    { key: "dashboard", label: "Dashboard", icon: "📊" },
    { key: "terminal", label: "Terminal", icon: ">" },
    { key: "spotlight", label: "Spotlight", icon: "◎" },
    { key: "table", label: "Table", icon: "≡" },
    { key: "trustmeter", label: "Trust Meter", icon: "🎯" },
    { key: "ticker", label: "Ticker", icon: "📺" },
    { key: "timeline", label: "Timeline", icon: "⏱" },
    { key: "chat", label: "Chat", icon: "💬" }
  ];

  const current = $derived(
    LAYOUTS.find((l) => l.key === $activeLayout) ?? LAYOUTS[0]
  );
</script>

<Popover
  label="Disposition de l'affichage"
  panelRole="listbox"
  panelClass="w-48 p-1.5">
  {#snippet trigger({ toggle, open })}
    <button
      type="button"
      class="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-edge bg-surface px-3 text-xs text-fg-muted transition-colors hover:border-edge-hi hover:text-fg"
      aria-haspopup="listbox"
      aria-expanded={open}
      title="Disposition de l'affichage"
      onclick={toggle}>
      <span aria-hidden="true">{current.icon}</span>
      <span class="font-medium text-fg">{current.label}</span>
      <span class="text-fg-faint" aria-hidden="true">▾</span>
    </button>
  {/snippet}

  {#snippet children({ close })}
    {#each LAYOUTS as l (l.key)}
      <button
        type="button"
        role="option"
        aria-selected={$activeLayout === l.key}
        class={[
          "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
          $activeLayout === l.key
            ? "bg-surface-selected text-fg"
            : "text-fg-muted hover:bg-surface hover:text-fg"
        ]}
        onclick={() => {
          activeLayout.set(l.key);
          close();
        }}>
        <span class="flex items-center gap-2">
          <span aria-hidden="true">{l.icon}</span>
          <span>{l.label}</span>
        </span>
        {#if $activeLayout === l.key}
          <span class="text-accent" aria-hidden="true">✓</span>
        {/if}
      </button>
    {/each}
  {/snippet}
</Popover>
