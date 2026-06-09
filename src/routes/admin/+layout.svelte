<script lang="ts">
  import { goto } from "$app/navigation";
  import { page } from "$app/state";
  import { clearToken, getToken, token } from "$lib/stores/auth";
  import { onMount } from "svelte";

  let { children } = $props();
  let ready = $state(false);

  onMount(() => {
    if (!getToken()) {
      goto("/login");
    } else {
      ready = true;
    }
  });

  // Redirect out if the token is cleared while on an admin page.
  $effect(() => {
    if (ready && $token === null) goto("/login");
  });

  function logout() {
    clearToken();
    goto("/login");
  }

  const nav = [
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
      class="flex w-60 shrink-0 flex-col gap-6 border-r border-surface-raised bg-surface-alt px-[0.9rem] py-5">
      <div class="flex items-center gap-[0.6rem] px-[0.4rem]">
        <span class="text-[1.4rem]">🔍</span>
        <div class="flex flex-col leading-[1.2]">
          <strong class="text-[0.92rem]">LiveFactChecker</strong>
          <span class="text-[0.68rem] tracking-wider text-[#7a7ac0] uppercase">Admin</span>
        </div>
      </div>
      <nav class="flex flex-col gap-1">
        {#each nav as item}
          <a
            href={item.href}
            class={[
              "flex items-center gap-[0.6rem] rounded-lg px-[0.7rem] py-[0.6rem] text-[0.88rem] no-underline transition-[background,color] duration-150",
              page.url.pathname === item.href
                ? "bg-[#26264a] text-white"
                : "text-[#9a9ab0] hover:bg-surface hover:text-fg"
            ]}>
            <span>{item.icon}</span>
            {item.label}
          </a>
        {/each}
      </nav>
      <div class="mt-auto flex flex-col gap-2">
        <a
          class="px-[0.7rem] py-[0.3rem] text-[0.8rem] text-fg-faint no-underline hover:text-fg-muted"
          href="/">↩ Application live</a>
        <button
          onclick={logout}
          class="cursor-pointer rounded-lg border border-[#3a2a3a] bg-transparent p-2 text-[0.82rem] text-[#d08a8a] transition-all duration-150 hover:border-red-900 hover:bg-[rgba(220,80,80,0.12)]"
          >Déconnexion</button>
      </div>
    </aside>
    <main class="flex-1 overflow-y-auto p-8">
      {@render children()}
    </main>
  </div>
{/if}

<style>
  :global(body) {
    margin: 0;
    background: var(--color-background);
    color: var(--color-fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
</style>
