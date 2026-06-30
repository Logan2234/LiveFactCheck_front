<script lang="ts" module>
  import type { IconName } from "$lib/components/ui/Icon.svelte";
  import type { StaticRouteId } from "$lib/utils/navigation";

  export type NavRailItem = {
    href: StaticRouteId;
    label: string;
    icon: IconName;
  };
  // An optional eyebrow groups items that share a function (e.g. "PIPELINE").
  export type NavRailGroup = { label?: string; items: NavRailItem[] };
</script>

<script lang="ts">
  import { resolve } from "$app/paths";
  import Icon from "$lib/components/ui/Icon.svelte";
  import Logotype from "$lib/components/ui/Logotype.svelte";
  import type { Snippet } from "svelte";

  // The shared back-office sidebar — one rail for both /admin and /account, so the
  // chrome stays identical and changes propagate. The caller supplies the logotype
  // context label, the grouped nav and a footer (theme toggle, links, sign-out).
  let {
    brandLabel,
    brandHref,
    groups,
    current,
    footer
  }: {
    brandLabel: string;
    brandHref?: StaticRouteId;
    groups: NavRailGroup[];
    current: string;
    footer: Snippet;
  } = $props();

  // Highlight the exact page, and keep the parent lit on its detail routes
  // (e.g. /admin/sessions stays active on /admin/sessions/[id]).
  function isActive(href: StaticRouteId): boolean {
    if (current === href) return true;
    const isIndex = href === "/admin" || href === "/account";
    return !isIndex && current.startsWith(href + "/");
  }

  // Below md the rail is an off-canvas drawer behind a top bar + hamburger, so a
  // 240px sidebar doesn't swallow a phone screen. `open` only matters there.
  let open = $state(false);
</script>

<!-- Mobile top bar: stacks above the content (wrapper is `md:flex`, so block here). -->
<div
  class="flex items-center justify-between border-b border-edge bg-surface-alt px-4 py-3 md:hidden">
  <Logotype label={brandLabel} href={brandHref} />
  <button
    type="button"
    onclick={() => (open = true)}
    aria-label="Ouvrir le menu"
    aria-expanded={open}
    class="rounded-md p-1.5 text-fg-muted transition-colors hover:bg-surface hover:text-fg">
    <Icon name="menu" size={22} />
  </button>
</div>

<!-- Backdrop (mobile, only while open) -->
{#if open}
  <button
    type="button"
    onclick={() => (open = false)}
    aria-label="Fermer le menu"
    class="fixed inset-0 z-40 bg-black/50 md:hidden"></button>
{/if}

<aside
  aria-label="Navigation"
  class={[
    "fixed inset-y-0 left-0 z-50 flex w-60 shrink-0 flex-col gap-6 border-r border-edge bg-surface-alt px-3 py-5 transition-transform duration-200 ease-out",
    "md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0",
    open ? "translate-x-0" : "-translate-x-full"
  ]}>
  <div class="flex items-center justify-between px-2">
    <Logotype label={brandLabel} href={brandHref} />
    <button
      type="button"
      onclick={() => (open = false)}
      aria-label="Fermer le menu"
      class="rounded-md p-1 text-fg-muted transition-colors hover:bg-surface hover:text-fg md:hidden">
      <Icon name="x" size={20} />
    </button>
  </div>

  <!-- Primary cross-area action: leave the back-office for the live app. Lives at
       the top (not buried in the footer) since it's the main way out. -->
  <a
    href={resolve("/")}
    onclick={() => (open = false)}
    class="flex items-center gap-2 rounded-md border border-edge px-3 py-2 text-sm text-fg-muted transition-colors hover:border-edge-hi hover:bg-surface hover:text-fg">
    <Icon name="arrow-left" size={15} />
    Le direct
  </a>

  <nav class="flex flex-1 flex-col gap-5 overflow-y-auto">
    {#each groups as group, gi (gi)}
      <div class="flex flex-col gap-0.5">
        {#if group.label}
          <span
            class="mb-1 px-3 text-2xs font-semibold tracking-[0.18em] text-fg-faint uppercase">
            {group.label}
          </span>
        {/if}
        {#each group.items as item (item.href)}
          {@const active = isActive(item.href)}
          <a
            href={resolve(item.href)}
            aria-current={active ? "page" : undefined}
            onclick={() => (open = false)}
            class={[
              "relative flex items-center gap-3 rounded-md py-2 pr-3 pl-4 text-sm no-underline outline-none transition-[background,color] duration-150 focus-visible:bg-surface",
              active
                ? "bg-surface-selected text-fg"
                : "text-fg-muted hover:bg-surface hover:text-fg"
            ]}>
            <!-- tally light: the on-air marker on the selected channel -->
            <span
              class={[
                "absolute top-1/2 left-0 h-4 w-[2.5px] -translate-y-1/2 rounded-full bg-accent transition-opacity duration-150",
                active ? "opacity-100" : "opacity-0"
              ]}
              aria-hidden="true"></span>
            <Icon name={item.icon} class={active ? "text-accent-light" : ""} />
            {item.label}
          </a>
        {/each}
      </div>
    {/each}
  </nav>

  <div class="flex flex-col gap-2">
    {@render footer()}
  </div>
</aside>
