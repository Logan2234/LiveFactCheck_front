<script lang="ts">
  import { authFetch, clearToken } from "$lib/stores/auth";
  import type { Claim } from "$lib/stores/claims";
  import ClaimCard from "$lib/components/ClaimCard.svelte";

  interface Usage {
    input_tokens: number;
    output_tokens: number;
    cache_write: number;
    cache_read: number;
  }

  interface DebugInfo {
    turns: number;
    usage: Usage;
    model: string;
    web_search_called: boolean;
  }

  let text = $state("");
  let loading = $state(false);
  let error = $state("");
  let claims = $state<Claim[] | null>(null);
  let elapsed = $state(0);
  let menuOpen = $state(false);
  let webSearch = $state(true);
  let debug = $state<DebugInfo | null>(null);

  // Jeux de tests pour couvrir chaque comportement de la pipeline.
  const examples: { label: string; hint: string; text: string }[] = [
    {
      label: "Faits vrais (immuables)",
      hint: "✅ vérifié · 🧠 sans recherche",
      text: "La Tour Eiffel mesure 330 mètres de haut et a été construite en 1889 pour l'Exposition universelle de Paris. L'eau bout à 100 degrés Celsius au niveau de la mer."
    },
    {
      label: "Faits faux",
      hint: "❌ faux · counter_claim",
      text: "La Grande Muraille de Chine est visible à l'œil nu depuis la Lune. Albert Einstein a inventé l'ampoule électrique en 1923. Le Mont Everest culmine à 12 000 mètres."
    },
    {
      label: "Actualité (récente)",
      hint: "🌐 recherche web probable",
      text: "Le dernier lauréat du prix Nobel de la paix a été annoncé cette année. Le président actuel des États-Unis a signé un décret la semaine dernière."
    },
    {
      label: "Incertain / invérifiable",
      hint: "❓ incertain · 🔍 invérifiable",
      text: "Il y aurait environ 100 milliards d'étoiles dans la Voie lactée. Le café que j'ai bu ce matin était le meilleur de ma vie. Jules César aurait prononcé exactement 1 200 mots lors de son dernier discours."
    },
    {
      label: "Mix de statuts",
      hint: "plusieurs statuts à la fois",
      text: "Paris est la capitale de la France. La France compte 50 régions. Le TGV peut rouler à plus de 300 km/h. Napoléon est mort empoisonné par les Anglais."
    },
    {
      label: "Opinions seules",
      hint: "liste vide attendue",
      text: "Je pense que ce film est génial. À mon avis, l'été est la plus belle saison. Je m'appelle Logan et j'adore la pizza."
    }
  ];

  function loadExample(t: string) {
    text = t;
    menuOpen = false;
  }

  function toClaim(raw: any, i: number): Claim {
    return {
      id: `test-${i}`,
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

  async function run(e: Event) {
    e.preventDefault();
    if (loading || text.trim().length === 0) return;
    error = "";
    claims = null;
    debug = null;
    loading = true;
    const start = performance.now();
    try {
      const res = await authFetch("/admin/model-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, web_search: webSearch })
      });
      if (res.status === 401) {
        clearToken();
        return;
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Erreur ${res.status}`);
      }
      const data = await res.json();
      claims = (data.claims ?? []).map(toClaim);
      debug = {
        turns: data.turns,
        usage: data.usage,
        model: data.model,
        web_search_called: (data.claims ?? []).some((c: any) => c.web_search_used)
      };
    } catch (err) {
      error = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      elapsed = Math.round(performance.now() - start);
      loading = false;
    }
  }

  function cacheRatio(u: Usage): string {
    const total = u.input_tokens + u.cache_read;
    if (!total) return "—";
    return ((u.cache_read / total) * 100).toFixed(0) + " %";
  }
</script>

<svelte:head>
  <title>Test pipeline — Admin</title>
</svelte:head>

<header>
  <h1>🧪 Test de la pipeline</h1>
  <p>Envoie un texte directement à l'extraction + vérification de claims (POST /fact-check).</p>
</header>

<form onsubmit={run}>
  <textarea bind:value={text} rows="6" placeholder="Colle ou écris un texte à analyser…"></textarea>

  <div class="actions">
    <div class="dropdown">
      <button type="button" class="ghost" onclick={() => (menuOpen = !menuOpen)}>
        Exemples ▾
      </button>
      {#if menuOpen}
        <button
          type="button"
          class="menu-backdrop"
          aria-label="Fermer"
          onclick={() => (menuOpen = false)}></button>
        <ul class="menu">
          {#each examples as ex}
            <li>
              <button type="button" onclick={() => loadExample(ex.text)}>
                <span class="ex-label">{ex.label}</span>
                <span class="ex-hint">{ex.hint}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <button type="button" class="ghost" onclick={() => (text = "")} disabled={!text}>
      Vider
    </button>
    <span class="spacer"></span>
    <label class="switch" title="Activer / désactiver la recherche web pour cette analyse">
      <input type="checkbox" bind:checked={webSearch} />
      <span class="track"><span class="thumb"></span></span>
      <span class="switch-label">{webSearch ? "🌐 Web" : "🧠 Sans web"}</span>
    </label>
    <button type="submit" disabled={loading || text.trim().length === 0}>
      {loading ? "Analyse en cours…" : "Analyser"}
    </button>
  </div>
</form>

{#if error}
  <p class="error" role="alert">{error}</p>
{/if}

{#if loading}
  <div class="placeholder">
    <span class="spinner"></span>
    Extraction et vérification… (le web search peut prendre quelques secondes)
  </div>
{:else if claims !== null}
  <div class="results-head">
    <h2>
      {claims.length} claim{claims.length > 1 ? "s" : ""}
    </h2>
    <span class="elapsed">{(elapsed / 1000).toFixed(1)} s</span>
  </div>

  {#if debug}
    <div class="debug-bar">
      <span class="debug-item">
        <span class="debug-label">Modèle</span>
        <code>{debug.model}</code>
      </span>
      <span class="debug-sep">·</span>
      <span class="debug-item">
        <span class="debug-label">Tours</span>
        <span class="chip {debug.turns === 2 ? 'chip-warn' : 'chip-ok'}">{debug.turns}</span>
      </span>
      <span class="debug-sep">·</span>
      <span class="debug-item">
        <span class="debug-label">Web search</span>
        <span class="chip {debug.web_search_called ? 'chip-info' : 'chip-neutral'}">
          {debug.web_search_called ? "déclenchée" : "non utilisée"}
        </span>
      </span>
      <span class="debug-sep">·</span>
      <span class="debug-item">
        <span class="debug-label">Tokens</span>
        <span>{(debug.usage.input_tokens + debug.usage.output_tokens).toLocaleString()}</span>
      </span>
      {#if debug.usage.cache_read > 0}
        <span class="debug-sep">·</span>
        <span class="debug-item">
          <span class="debug-label">Cache hit</span>
          <span class="cache-hit">{cacheRatio(debug.usage)}</span>
        </span>
      {/if}
    </div>
  {/if}

  {#if claims.length === 0}
    <p class="empty">Aucun fait vérifiable trouvé dans ce texte.</p>
  {:else}
    <div class="claims">
      {#each claims as claim (claim.id)}
        <ClaimCard {claim} />
      {/each}
    </div>
  {/if}
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

  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }

  .spacer {
    flex: 1;
  }

  .switch {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  .switch input {
    position: absolute;
    opacity: 0;
    width: 0;
    height: 0;
  }

  .track {
    position: relative;
    width: 38px;
    height: 22px;
    border-radius: 999px;
    background: #2e2e3e;
    border: 1px solid #3a3a4e;
    transition:
      background 0.15s,
      border-color 0.15s;
    flex-shrink: 0;
  }

  .thumb {
    position: absolute;
    top: 2px;
    left: 2px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #b0b0c8;
    transition:
      transform 0.15s,
      background 0.15s;
  }

  .switch input:checked + .track {
    background: #3a3a7a;
    border-color: #5a5ad0;
  }

  .switch input:checked + .track .thumb {
    transform: translateX(16px);
    background: #c8c8ff;
  }

  .switch input:focus-visible + .track {
    box-shadow: 0 0 0 2px rgba(106, 106, 204, 0.5);
  }

  .switch-label {
    font-size: 0.82rem;
    color: #9a9ab0;
    min-width: 76px;
  }

  .dropdown {
    position: relative;
  }

  .menu-backdrop {
    position: fixed;
    inset: 0;
    background: transparent;
    border: none;
    padding: 0;
    z-index: 40;
    cursor: default;
  }

  .menu {
    position: absolute;
    top: calc(100% + 0.4rem);
    left: 0;
    z-index: 50;
    list-style: none;
    margin: 0;
    padding: 0.35rem;
    min-width: 260px;
    background: #1a1a2a;
    border: 1px solid #2e2e3e;
    border-radius: 10px;
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .menu li button {
    width: 100%;
    text-align: left;
    background: transparent;
    border: none;
    border-radius: 7px;
    padding: 0.5rem 0.65rem;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    cursor: pointer;
    transition: background 0.12s;
  }

  .menu li button:hover {
    background: #26263a;
  }

  .ex-label {
    color: #e8e8f0;
    font-size: 0.86rem;
    font-weight: 500;
  }

  .ex-hint {
    color: #7a7a98;
    font-size: 0.74rem;
    font-weight: 400;
  }

  button {
    border-radius: 8px;
    padding: 0.6rem 1.1rem;
    font-size: 0.88rem;
    font-weight: 600;
    cursor: pointer;
    border: none;
    transition:
      opacity 0.15s,
      background 0.15s;
  }

  button[type="submit"] {
    background: linear-gradient(135deg, #5a5ad0, #7a4ad0);
    color: #fff;
  }

  button[type="submit"]:hover:not(:disabled) {
    opacity: 0.92;
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

  .error {
    background: rgba(239, 68, 68, 0.12);
    border: 1px solid rgba(239, 68, 68, 0.4);
    color: #fca5a5;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    font-size: 0.85rem;
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

  .results-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 0.8rem;
  }

  .results-head h2 {
    font-size: 1.05rem;
    margin: 0;
  }

  .elapsed {
    color: #6a6a88;
    font-size: 0.8rem;
    font-variant-numeric: tabular-nums;
  }

  .empty {
    color: #8888a0;
    font-size: 0.9rem;
    padding: 1.2rem;
    background: #161624;
    border: 1px dashed #2e2e3e;
    border-radius: 10px;
    text-align: center;
  }

  .debug-bar {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem 0.6rem;
    background: #0e0e1c;
    border: 1px solid #1e1e2e;
    border-radius: 8px;
    padding: 0.45rem 0.85rem;
    margin-bottom: 0.9rem;
    font-size: 0.78rem;
    color: #7a7a98;
  }

  .debug-item {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }

  .debug-label {
    color: #4a4a68;
  }

  .debug-bar code {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.74rem;
    color: #8888b8;
  }

  .debug-sep {
    color: #2e2e4e;
  }

  .chip {
    border-radius: 999px;
    padding: 0.1rem 0.45rem;
    font-size: 0.72rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .chip-ok {
    background: rgba(34, 197, 94, 0.1);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.2);
  }
  .chip-warn {
    background: rgba(245, 158, 11, 0.1);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.2);
  }
  .chip-info {
    background: rgba(99, 179, 237, 0.1);
    color: #63b3ed;
    border: 1px solid rgba(99, 179, 237, 0.2);
  }
  .chip-neutral {
    background: rgba(100, 100, 140, 0.1);
    color: #7070a0;
    border: 1px solid rgba(100, 100, 140, 0.15);
  }

  .cache-hit {
    color: #4ade80;
    font-weight: 500;
  }
</style>
