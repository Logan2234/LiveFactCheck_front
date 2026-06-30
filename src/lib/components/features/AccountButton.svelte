<script lang="ts">
  import { resolve } from "$app/paths";
  import Icon from "$lib/components/ui/Icon.svelte";
  import Popover from "$lib/components/ui/Popover.svelte";
  import {
    currentUser,
    logout,
    refreshMe,
    userToken
  } from "$lib/stores/userAuth";
  import { onMount } from "svelte";

  // Header entry to the account area. Signed out, it's a direct link to the
  // login card. Signed in, it opens a menu so the account pages — and crucially
  // "Se déconnecter" — are reachable from anywhere, not only from inside /account.
  onMount(() => {
    if ($userToken) refreshMe();
  });

  // Icon-only trigger to match the segmented header control group. Signed in we
  // show the username's initial (a tidy avatar glyph); signed out, the user icon.
  const triggerClass =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-fg-muted no-underline transition-colors hover:bg-surface-raised hover:text-fg";

  const initial = $derived(
    $currentUser?.username?.charAt(0).toUpperCase() ?? ""
  );

  const menuItem =
    "flex items-center gap-2 px-4 py-2.5 text-sm text-fg-muted no-underline transition-colors hover:bg-surface hover:text-fg";
</script>

{#if $currentUser}
  <Popover label="Menu du compte" panelClass="w-56">
    {#snippet trigger({ toggle, open })}
      <button
        type="button"
        class={triggerClass}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={$currentUser.username}
        aria-label="Compte : {$currentUser.username}"
        onclick={toggle}>
        <span class="text-fg text-sm font-semibold">{initial}</span>
      </button>
    {/snippet}

    {#snippet children({ close })}
      <div class="border-edge border-b px-4 py-2.5">
        <p class="text-fg m-0 truncate text-sm font-medium">
          {$currentUser?.username}
        </p>
        <p class="text-fg-faint m-0 truncate text-xs">{$currentUser?.email}</p>
      </div>
      <nav class="flex flex-col py-1">
        <a href={resolve("/account")} class={menuItem} onclick={close}>
          <span aria-hidden="true">🎙</span> Mon desk
        </a>
        <a href={resolve("/account/alerts")} class={menuItem} onclick={close}>
          <span aria-hidden="true">🔔</span> Alertes
        </a>
        <a href={resolve("/account/profile")} class={menuItem} onclick={close}>
          <span aria-hidden="true">👤</span> Compte
        </a>
      </nav>
      <div class="border-edge border-t py-1">
        <button
          type="button"
          class="{menuItem} w-full cursor-pointer border-0 bg-transparent text-left"
          onclick={() => {
            logout();
            close();
          }}>
          <span aria-hidden="true">↩</span> Se déconnecter
        </button>
      </div>
    {/snippet}
  </Popover>
{:else}
  <a
    href={resolve("/account")}
    class={triggerClass}
    title="Connexion"
    aria-label="Connexion">
    <Icon name="user" />
  </a>
{/if}
