<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import type { RouteId } from "$app/types";
  import Button from "$lib/components/ui/Button.svelte";
  import ThemeToggle from "$lib/components/features/ThemeToggle.svelte";
  import { clearToken, getToken, token } from "$lib/stores/auth";
  import { navigate } from "$lib/utils/navigation";
  import { onMount } from "svelte";

  let { children } = $props();
  let ready = $state(false);

  onMount(() => {
    if (!getToken()) {
      void navigate("/login");
    } else {
      ready = true;
    }
  });

  // Redirect out if the token is cleared while on an admin page.
  $effect(() => {
    if (ready && $token === null) {
      void navigate("/login");
    }
  });

  function logout() {
    clearToken();
    void navigate("/login");
  }

  const nav: { href: RouteId; label: string; icon: string }[] = [
    { href: "/admin", label: "Test pipeline", icon: "🧪" },
    { href: "/admin/benchmark", label: "Benchmark", icon: "⚡" },
    { href: "/admin/prompt", label: "Prompt & Outil", icon: "📋" },
    { href: "/admin/system", label: "Système", icon: "🖥️" },
    { href: "/admin/logs", label: "Logs", icon: "📜" },
    { href: "/admin/whisper", label: "Test Whisper", icon: "🎙️" },
    { href: "/admin/ws", label: "WebSockets", icon: "🔌" }
  ];
</script>

{#if ready}
  <div class="flex min-h-screen">
    <aside
      aria-label="Navigation principale"
      role="navigation"
      class="flex w-60 shrink-0 flex-col gap-6 border-r border-surface-raised bg-surface-alt px-3.5 py-5">
      <div class="flex items-center gap-2.5 px-1.5">
        <span class="text-2xl">🔍</span>
        <div class="flex flex-col leading-[1.2]">
          <strong class="text-sm">LiveFactChecker</strong>
          <span class="text-2xs tracking-wider text-accent-light uppercase"
            >Admin</span>
        </div>
      </div>
      <nav class="flex flex-col gap-1">
        {#each nav as item (item.href)}
          <a
            href={resolve(item.href)}
            class={[
              "items-center flex gap-2.5 rounded-lg px-3 py-2.5 text-sm no-underline transition-[background,color] duration-150",
              page.url.pathname === item.href
                ? "bg-surface-selected text-fg"
                : "text-fg-muted hover:bg-surface hover:text-fg"
            ]}>
            <span>{item.icon}</span>
            {item.label}
          </a>
        {/each}
      </nav>
      <div class="mt-auto flex flex-col gap-2">
        <ThemeToggle />
        <a
          class="px-3 py-1.5 text-sm text-fg-faint no-underline hover:text-fg-muted"
          href={resolve("/")}>↩ Application live</a>
        <Button onclick={logout} variant="danger" size="xs">Déconnexion</Button>
      </div>
    </aside>
    <main class="flex-1 overflow-y-auto p-8">
      {@render children()}
    </main>
  </div>
{/if}
