<script lang="ts">
  import { resolve } from "$app/paths";
  import Button from "$lib/components/ui/Button.svelte";
  import { login } from "$lib/stores/auth";
  import { navigate } from "$lib/utils/navigation";

  let password = $state("");
  let error = $state("");
  let loading = $state(false);

  async function submit(e: Event) {
    e.preventDefault();
    if (loading) return;
    error = "";
    loading = true;
    try {
      await login(password);
      await navigate("/admin");
    } catch (err) {
      error = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Connexion — LiveFactChecker</title>
</svelte:head>

<main
  class="flex min-h-screen items-center justify-center p-6"
  style="background: radial-gradient(1200px 600px at 50% -10%, rgba(85, 85, 170, 0.25), transparent 60%), var(--color-background);">
  <form
    class="flex w-full max-w-90 flex-col gap-4 rounded-2xl border border-edge bg-surface-alt p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
    onsubmit={submit}>
    <div class="mb-1 text-center">
      <div class="mb-2 flex items-center justify-center gap-2">
        <span class="live-dot" aria-hidden="true"></span>
        <span
          class="text-2xs font-semibold tracking-[0.22em] text-accent-light uppercase">
          Live Fact Checker
        </span>
      </div>
      <h1
        class="m-0 font-display text-3xl font-extrabold tracking-tight uppercase">
        Régie
      </h1>
      <p class="m-0 mt-0.5 text-sm text-fg-muted">Accès administrateur</p>
    </div>

    <label class="flex flex-col gap-1.5 text-sm text-fg-muted">
      <span>Mot de passe</span>
      <input
        type="password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="current-password"
        required
        class="border border-edge rounded-lg bg-surface px-3.5 py-3 text-base text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none" />
    </label>

    {#if error}
      <p
        class="m-0 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2.5 text-sm text-red-300"
        role="alert">
        {error}
      </p>
    {/if}

    <Button type="submit" disabled={loading || password.length === 0}>
      {loading ? "Connexion…" : "Se connecter"}
    </Button>

    <a
      class="text-center text-sm text-fg-faint no-underline hover:text-fg-muted"
      href={resolve("/")}>← Retour à l'application</a>
  </form>
</main>

<style>
  .live-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: var(--color-accent);
    flex-shrink: 0;
    animation: dot-pulse 1.6s ease-in-out infinite;
  }

  @keyframes dot-pulse {
    0%,
    100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.5;
      transform: scale(0.72);
    }
  }
</style>
