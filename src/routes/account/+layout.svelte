<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import ThemeToggle from "$lib/components/features/ThemeToggle.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import NavRail, {
    type NavRailGroup
  } from "$lib/components/ui/NavRail.svelte";
  import {
    currentUser,
    login,
    logout,
    refreshMe,
    signup
  } from "$lib/stores/userAuth";
  import { onMount } from "svelte";

  let { children } = $props();

  const inputClass =
    "border border-edge rounded-lg bg-surface px-3.5 py-2.5 text-sm text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none";

  // Resolve the stored token once before deciding what to show, so a signed-in
  // reload doesn't flash the login card.
  let ready = $state(false);

  // --- auth card (signed out) ---
  let mode = $state<"login" | "signup">("login");
  let email = $state("");
  let username = $state("");
  let password = $state("");
  let authError = $state("");
  let authLoading = $state(false);

  async function submitAuth(e: Event) {
    e.preventDefault();
    if (authLoading) return;
    authError = "";
    authLoading = true;
    try {
      if (mode === "signup") await signup(email, username, password);
      else await login(username, password);
    } catch (err) {
      authError = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      authLoading = false;
    }
  }

  const groups: NavRailGroup[] = [
    {
      items: [{ href: "/account", label: "Accueil", icon: "dashboard" }]
    },
    {
      label: "Diffusion",
      items: [
        { href: "/account/alerts", label: "Alertes", icon: "bell" },
        { href: "/account/notifications", label: "Notifications", icon: "send" }
      ]
    },
    {
      label: "Compte",
      items: [
        { href: "/account/profile", label: "Compte", icon: "user" },
        { href: "/account/data", label: "Mes données", icon: "package" }
      ]
    }
  ];

  onMount(async () => {
    await refreshMe();
    ready = true;
  });
</script>

<svelte:head>
  <title>Mon espace — LiveFactChecker</title>
</svelte:head>

{#if ready && !$currentUser}
  <!-- Signed out: one card, login/signup toggle -->
  <main class="auth-bg flex min-h-screen items-center justify-center p-6">
    <form
      class="border-edge bg-surface-alt flex w-full max-w-90 flex-col gap-4 rounded-2xl border p-8 shadow-elevated"
      onsubmit={submitAuth}>
      <div class="mb-1 text-center">
        <div class="mb-2 flex items-center justify-center gap-2">
          <span class="live-dot" aria-hidden="true"></span>
          <span
            class="text-accent-light text-2xs font-semibold tracking-[0.22em] uppercase">
            Live Fact Checker
          </span>
        </div>
        <h1 class="font-display m-0 text-2xl font-extrabold tracking-tight">
          {mode === "login" ? "Connexion" : "Créer un compte"}
        </h1>
        <p class="text-fg-muted m-0 mt-0.5 text-sm">
          Pour recevoir vos alertes en direct
        </p>
      </div>

      {#if mode === "signup"}
        <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
          <span>Email</span>
          <input
            type="email"
            bind:value={email}
            placeholder="vous@exemple.fr"
            autocomplete="email"
            required
            class={inputClass} />
        </label>
      {/if}

      <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
        <span
          >{mode === "login"
            ? "Email ou nom d'utilisateur"
            : "Nom d'utilisateur"}</span>
        <input
          type="text"
          bind:value={username}
          placeholder={mode === "login" ? "vous@exemple.fr" : "votre_pseudo"}
          autocomplete="username"
          required
          class={inputClass} />
      </label>

      <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
        <span>Mot de passe</span>
        <input
          type="password"
          bind:value={password}
          placeholder="••••••••"
          autocomplete={mode === "login" ? "current-password" : "new-password"}
          required
          class={inputClass} />
      </label>

      {#if authError}
        <p
          class="m-0 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2.5 text-sm text-red-300"
          role="alert">
          {authError}
        </p>
      {/if}

      <Button type="submit" disabled={authLoading}>
        {#if authLoading}
          {mode === "login" ? "Connexion…" : "Création…"}
        {:else}
          {mode === "login" ? "Se connecter" : "Créer le compte"}
        {/if}
      </Button>

      <button
        type="button"
        class="text-fg-faint hover:text-fg-muted m-0 cursor-pointer border-0 bg-transparent text-center text-sm"
        onclick={() => {
          mode = mode === "login" ? "signup" : "login";
          authError = "";
        }}>
        {mode === "login"
          ? "Pas encore de compte ? Créez-en un"
          : "Déjà un compte ? Connectez-vous"}
      </button>

      <a
        class="text-fg-faint hover:text-fg-muted text-center text-sm no-underline"
        href={resolve("/")}>← Retour à l'application</a>
    </form>
  </main>
{:else if ready}
  <!-- Signed in: rail + content -->
  <div class="min-h-screen md:flex">
    <NavRail
      brandLabel="Mon espace"
      brandHref="/account"
      {groups}
      current={page.url.pathname}>
      {#snippet footer()}
        <ThemeToggle />
        <Button onclick={logout} variant="secondary" size="xs">
          Se déconnecter
        </Button>
      {/snippet}
    </NavRail>
    <main class="flex-1 overflow-y-auto p-6 sm:p-8">
      <div class="mx-auto max-w-3xl">
        {@render children()}
      </div>
    </main>
  </div>
{/if}

<style>
  .live-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
    animation: dot-pulse 1.4s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.45;
      transform: scale(0.72);
    }
  }
</style>
