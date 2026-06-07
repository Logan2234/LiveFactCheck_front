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

<main>
  <form class="card" onsubmit={submit}>
    <div class="brand">
      <span class="logo">🔍</span>
      <h1>LiveFactChecker</h1>
      <p class="subtitle">Panel administrateur</p>
    </div>

    <label class="field">
      <span>Mot de passe</span>
      <input
        type="password"
        bind:value={password}
        placeholder="••••••••"
        autocomplete="current-password"
        required />
    </label>

    {#if error}
      <p class="error" role="alert">{error}</p>
    {/if}

    <button type="submit" disabled={loading || password.length === 0}>
      {loading ? "Connexion…" : "Se connecter"}
    </button>

    <a class="back" href="/">← Retour à l'application</a>
  </form>
</main>

<style>
  :global(body) {
    margin: 0;
    background: #121220;
    color: #e0e0e0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  main {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
    background:
      radial-gradient(1200px 600px at 50% -10%, rgba(85, 85, 170, 0.25), transparent 60%),
      #121220;
  }

  .card {
    width: 100%;
    max-width: 360px;
    background: #1a1a2a;
    border: 1px solid #2e2e3e;
    border-radius: 16px;
    padding: 2rem;
    display: flex;
    flex-direction: column;
    gap: 1.1rem;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.45);
  }

  .brand {
    text-align: center;
    margin-bottom: 0.5rem;
  }

  .logo {
    font-size: 2rem;
  }

  h1 {
    font-size: 1.25rem;
    margin: 0.4rem 0 0.1rem;
  }

  .subtitle {
    margin: 0;
    color: #8888a0;
    font-size: 0.82rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: #a0a0b8;
  }

  input {
    background: #12121e;
    border: 1px solid #2e2e3e;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    color: #e8e8f0;
    font-size: 0.95rem;
    transition: border-color 0.15s;
  }

  input:focus {
    outline: none;
    border-color: #6a6acc;
  }

  button {
    background: linear-gradient(135deg, #5a5ad0, #7a4ad0);
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 0.75rem;
    font-size: 0.95rem;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.05s;
  }

  button:hover:not(:disabled) {
    opacity: 0.92;
  }

  button:active:not(:disabled) {
    transform: translateY(1px);
  }

  button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  .error {
    margin: 0;
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    border-radius: 8px;
    padding: 0.6rem 0.8rem;
    font-size: 0.82rem;
  }

  .back {
    text-align: center;
    color: #6a6a88;
    font-size: 0.8rem;
    text-decoration: none;
  }

  .back:hover {
    color: #9a9ac0;
  }
</style>
