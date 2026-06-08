<script lang="ts">
  import { authFetch, clearToken } from "$lib/stores/auth";
  import type { Claim } from "$lib/stores/claims";
  import ClaimCard from "$lib/components/ClaimCard.svelte";

  let text = $state("");
  let loading = $state(false);
  let ran = $state(false);

  interface Side {
    claims: Claim[] | null;
    elapsed: number;
    error: string;
  }

  let withWeb = $state<Side>({ claims: null, elapsed: 0, error: "" });
  let withoutWeb = $state<Side>({ claims: null, elapsed: 0, error: "" });

  function toClaim(raw: any, i: number): Claim {
    return {
      id: `bench-${i}`,
      text: raw.text ?? "",
      status: raw.status ?? "uncertain",
      explanation: raw.explanation ?? "",
      sources: raw.sources ?? [],
      timestamp: Date.now(),
      category: raw.category ?? "",
      confidence: raw.confidence ?? 0,
      counter_claim: raw.counter_claim ?? "",
      web_search_used: raw.web_search_used ?? false
    };
  }

  async function fetchSide(web_search: boolean): Promise<Side> {
    const start = performance.now();
    try {
      const res = await authFetch("/fact-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, web_search })
      });
      const elapsed = Math.round(performance.now() - start);
      if (res.status === 401) {
        clearToken();
        return { claims: null, elapsed, error: "Session expirée" };
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        return { claims: null, elapsed, error: detail?.detail ?? `Erreur ${res.status}` };
      }
      const data = await res.json();
      return { claims: (data.claims ?? []).map(toClaim), elapsed, error: "" };
    } catch (e) {
      return {
        claims: null,
        elapsed: Math.round(performance.now() - start),
        error: e instanceof Error ? e.message : "Erreur réseau"
      };
    }
  }

  async function run(e: Event) {
    e.preventDefault();
    if (loading || !text.trim()) return;
    loading = true;
    ran = false;
    withWeb = { claims: null, elapsed: 0, error: "" };
    withoutWeb = { claims: null, elapsed: 0, error: "" };

    const [r1, r2] = await Promise.allSettled([fetchSide(true), fetchSide(false)]);
    withWeb = r1.status === "fulfilled" ? r1.value : { claims: null, elapsed: 0, error: "Erreur inattendue" };
    withoutWeb = r2.status === "fulfilled" ? r2.value : { claims: null, elapsed: 0, error: "Erreur inattendue" };
    loading = false;
    ran = true;
  }

  function delta(): string {
    if (!ran || withWeb.claims === null || withoutWeb.claims === null) return "";
    const diff = withWeb.claims.length - withoutWeb.claims.length;
    if (diff === 0) return "Même nombre de claims";
    return diff > 0
      ? `+${diff} claim${diff > 1 ? "s" : ""} avec le web`
      : `${diff} claim${Math.abs(diff) > 1 ? "s" : ""} avec le web`;
  }
</script>

<svelte:head>
  <title>Benchmark — Admin</title>
</svelte:head>

<header>
  <h1>⚡ Benchmark</h1>
  <p>Compare le même texte avec et sans recherche web en parallèle.</p>
</header>

<form onsubmit={run}>
  <textarea
    bind:value={text}
    rows="5"
    placeholder="Colle un texte à analyser…"
    disabled={loading}
  ></textarea>
  <div class="form-actions">
    <button type="button" class="ghost" onclick={() => (text = "")} disabled={!text || loading}>
      Vider
    </button>
    <span class="spacer"></span>
    <button type="submit" disabled={loading || !text.trim()}>
      {loading ? "Analyse en cours…" : "Comparer"}
    </button>
  </div>
</form>

{#if loading}
  <div class="columns">
    {#each ["🌐 Avec web search", "🧠 Sans web search"] as label}
      <div class="col">
        <div class="col-header">{label}</div>
        <div class="placeholder">
          <span class="spinner"></span> Analyse…
        </div>
      </div>
    {/each}
  </div>
{:else if ran}
  {#if delta()}
    <div class="delta-bar">{delta()}</div>
  {/if}
  <div class="columns">
    {#each [
      { label: "🌐 Avec web search", side: withWeb },
      { label: "🧠 Sans web search", side: withoutWeb }
    ] as { label, side }}
      <div class="col">
        <div class="col-header">
          {label}
          <span class="chip">{(side.elapsed / 1000).toFixed(1)} s</span>
          {#if side.claims !== null}
            <span class="chip">{side.claims.length} claim{side.claims.length !== 1 ? "s" : ""}</span>
          {/if}
        </div>
        {#if side.error}
          <p class="error" role="alert">{side.error}</p>
        {:else if side.claims !== null && side.claims.length === 0}
          <p class="empty">Aucun fait vérifiable trouvé.</p>
        {:else if side.claims !== null}
          <div class="claims-list">
            {#each side.claims as claim (claim.id)}
              <ClaimCard {claim} />
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>
{/if}

<style>
  header h1 {
    font-size: 1.4rem;
    margin: 0 0 0.3rem;
  }

  header p {
    color: #8888a0;
    font-size: 0.88rem;
    margin: 0 0 1.5rem;
  }

  form {
    margin-bottom: 1.5rem;
  }

  textarea {
    width: 100%;
    box-sizing: border-box;
    background: #161624;
    border: 1px solid #2e2e3e;
    border-radius: 10px;
    padding: 0.9rem 1rem;
    color: #e8e8f0;
    font-size: 0.95rem;
    font-family: inherit;
    line-height: 1.5;
    resize: vertical;
    transition: border-color 0.15s;
  }

  textarea:focus {
    outline: none;
    border-color: #6a6acc;
  }

  textarea:disabled {
    opacity: 0.5;
  }

  .form-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .spacer {
    flex: 1;
  }

  button {
    border-radius: 8px;
    padding: 0.6rem 1.1rem;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition: opacity 0.15s, background 0.15s;
  }

  button[type="submit"] {
    background: linear-gradient(135deg, #5a5ad0, #7a4ad0);
    color: #fff;
  }

  button[type="submit"]:hover:not(:disabled) {
    opacity: 0.9;
  }

  .ghost {
    background: #1e1e30;
    color: #b0b0c8;
    border: 1px solid #2e2e3e;
    font-weight: 500;
  }

  .ghost:hover:not(:disabled) {
    background: #26263a;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .delta-bar {
    text-align: center;
    font-size: 0.82rem;
    color: #9a9ac0;
    background: #1a1a30;
    border: 1px solid #2e2e4e;
    border-radius: 8px;
    padding: 0.45rem 1rem;
    margin-bottom: 1rem;
  }

  .columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.25rem;
  }

  .col {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    min-width: 0;
  }

  .col-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
    color: #c8c8e8;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #2e2e3e;
    flex-wrap: wrap;
  }

  .chip {
    background: #26263a;
    border: 1px solid #3a3a5a;
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    font-size: 0.75rem;
    color: #8888b0;
    font-weight: 400;
    font-variant-numeric: tabular-nums;
  }

  .placeholder {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    color: #8888a0;
    font-size: 0.9rem;
    padding: 1.5rem;
    background: #161624;
    border: 1px dashed #2e2e3e;
    border-radius: 10px;
  }

  .spinner {
    width: 16px;
    height: 16px;
    border: 2px solid #3a3a5a;
    border-top-color: #7a7ad0;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #fca5a5;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    font-size: 0.85rem;
    margin: 0;
  }

  .empty {
    color: #8888a0;
    font-size: 0.9rem;
    padding: 1.2rem;
    background: #161624;
    border: 1px dashed #2e2e3e;
    border-radius: 10px;
    text-align: center;
    margin: 0;
  }

  .claims-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
</style>
