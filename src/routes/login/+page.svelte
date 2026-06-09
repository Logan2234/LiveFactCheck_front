<script lang="ts">
  import { goto } from "$app/navigation";
  import { login } from "$lib/stores/auth";

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
      await goto("/admin");
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
  style="background: radial-gradient(1200px 600px at 50% -10%, rgba(85, 85, 170, 0.25), transparent 60%), #121220;">
  <form
    class="flex w-full max-w-90 flex-col gap-[1.1rem] rounded-2xl border border-edge bg-surface-alt p-8 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
    onsubmit={submit}>
    <div class="mb-2 text-center">
      <span class="text-[2rem]">🔍</span>
      <h1 class="mt-[0.4rem] mb-[0.1rem] text-xl">LiveFactChecker</h1>
      <p class="m-0 text-[0.82rem] text-fg-muted">Panel administrateur</p>
    </div>

    <label class="flex flex-col gap-[0.4rem] text-[0.82rem] text-[#a0a0b8]">
      <span>Mot de passe</span>
      <input
        type="password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="current-password"
        required
        class="rounded-lg border border-edge bg-background px-[0.9rem] py-[0.7rem] text-[0.95rem] text-slate-100 transition-[border-color] duration-150 focus:border-accent focus:outline-none" />
    </label>

    {#if error}
      <p
        class="m-0 rounded-lg border border-red-500/40 bg-red-500/12 px-[0.8rem] py-[0.6rem] text-[0.82rem] text-red-300"
        role="alert">
        {error}
      </p>
    {/if}

    <button
      type="submit"
      disabled={loading || password.length === 0}
      class="cursor-pointer rounded-lg border-none bg-[linear-gradient(135deg,#5a5ad0,#7a4ad0)] p-3 text-[0.95rem] font-semibold text-white transition-[opacity,transform] duration-150 enabled:hover:opacity-[0.92] enabled:active:translate-y-px disabled:cursor-not-allowed disabled:opacity-45">
      {loading ? "Connexion…" : "Se connecter"}
    </button>

    <a class="text-center text-[0.8rem] text-fg-faint no-underline hover:text-fg-muted" href="/"
      >← Retour à l'application</a>
  </form>
</main>

<style>
  :global(body) {
    margin: 0;
    background: var(--color-background);
    color: var(--color-fg);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
</style>
