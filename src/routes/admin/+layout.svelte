<script lang="ts">
  import { page } from "$app/state";
  import Button from "$lib/components/ui/Button.svelte";
  import NavRail, {
    type NavRailGroup
  } from "$lib/components/ui/NavRail.svelte";
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

  // Grouped by function so the eight tools read as three clusters, not a flat list.
  const groups: NavRailGroup[] = [
    {
      label: "Pipeline",
      items: [
        { href: "/admin", label: "Test pipeline", icon: "activity" },
        { href: "/admin/benchmark", label: "Benchmark", icon: "zap" },
        { href: "/admin/prompt", label: "Prompt & Outil", icon: "file-text" }
      ]
    },
    {
      label: "Système",
      items: [
        { href: "/admin/system", label: "Système", icon: "server" },
        { href: "/admin/logs", label: "Logs", icon: "list" },
        { href: "/admin/ws", label: "WebSockets", icon: "radio" },
        { href: "/admin/whisper", label: "Test Whisper", icon: "mic" }
      ]
    },
    {
      label: "Données",
      items: [{ href: "/admin/sessions", label: "Sessions", icon: "folder" }]
    }
  ];
</script>

{#if ready}
  <div class="min-h-screen md:flex">
    <NavRail brandLabel="Admin" {groups} current={page.url.pathname}>
      {#snippet footer()}
        <ThemeToggle />
        <Button onclick={logout} variant="danger" size="xs">Déconnexion</Button>
      {/snippet}
    </NavRail>
    <main class="flex-1 overflow-y-auto p-8">
      {@render children()}
    </main>
  </div>
{/if}
