<script lang="ts">
  import ClaimCard from "$lib/components/ClaimCard.svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";
  import type { Claim } from "$lib/stores/claims";

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
  <h1 class="mt-0 mb-[0.3rem] text-[1.4rem]">🧪 Test de la pipeline</h1>
  <p class="mt-0 mb-6 text-[0.88rem] text-fg-muted">
    Envoie un texte directement à l'extraction + vérification de claims (POST /fact-check).
  </p>
</header>

<form onsubmit={run} class="mb-6">
  <textarea
    bind:value={text}
    rows="6"
    placeholder="Colle ou écris un texte à analyser…"
    class="box-border w-full resize-y rounded-[10px] border border-edge bg-surface-alt px-4 py-[0.9rem] font-[inherit] text-[0.95rem] leading-normal text-slate-100 transition-[border-color] duration-150 focus:border-accent focus:outline-none"
  ></textarea>

  <div class="mt-3 flex items-center gap-2">
    <div class="relative">
      <button
        type="button"
        class="cursor-pointer rounded-lg border border-edge bg-surface px-[1.1rem] py-[0.6rem] text-[0.88rem] font-medium text-slate-300 transition-[opacity,background] duration-150 enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
        onclick={() => (menuOpen = !menuOpen)}>
        Exemples ▾
      </button>
      {#if menuOpen}
        <button
          type="button"
          class="fixed inset-0 z-40 cursor-default border-none bg-transparent p-0"
          aria-label="Fermer"
          onclick={() => (menuOpen = false)}></button>
        <ul
          class="absolute top-[calc(100%+0.4rem)] left-0 z-50 m-0 flex min-w-65 list-none flex-col gap-[0.15rem] rounded-[10px] border border-edge bg-surface-alt p-[0.35rem] shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          {#each examples as ex}
            <li>
              <button
                type="button"
                class="flex w-full cursor-pointer flex-col gap-[0.1rem] rounded-[7px] border-none bg-transparent px-[0.65rem] py-2 text-left transition-[background] duration-120 hover:bg-surface-raised"
                onclick={() => loadExample(ex.text)}>
                <span class="text-[0.86rem] font-medium text-slate-100">{ex.label}</span>
                <span class="text-[0.74rem] font-normal text-fg-faint">{ex.hint}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <button
      type="button"
      class="cursor-pointer rounded-lg border border-edge bg-surface px-[1.1rem] py-[0.6rem] text-[0.88rem] font-medium text-slate-300 transition-[opacity,background] duration-150 enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
      onclick={() => (text = "")}
      disabled={!text}>
      Vider
    </button>
    <span class="flex-1"></span>
    <label class="switch" title="Activer / désactiver la recherche web pour cette analyse">
      <input type="checkbox" bind:checked={webSearch} />
      <span class="track"><span class="thumb"></span></span>
      <span class="switch-label">{webSearch ? "🌐 Web" : "🧠 Sans web"}</span>
    </label>
    <button
      type="submit"
      disabled={loading || text.trim().length === 0}
      class="cursor-pointer rounded-lg border-none bg-[linear-gradient(135deg,#5a5ad0,#7a4ad0)] px-[1.1rem] py-[0.6rem] text-[0.88rem] font-semibold text-white transition-[opacity,background] duration-150 enabled:hover:opacity-92 disabled:cursor-not-allowed disabled:opacity-40">
      {loading ? "Analyse en cours…" : "Analyser"}
    </button>
  </div>
</form>

{#if error}
  <p
    class="rounded-lg border border-red-500/40 bg-red-500/12 px-[0.9rem] py-[0.7rem] text-[0.85rem] text-red-300"
    role="alert">
    {error}
  </p>
{/if}

{#if loading}
  <div
    class="flex items-center gap-[0.7rem] rounded-[10px] border border-dashed border-edge bg-surface-alt p-6 text-[0.9rem] text-fg-muted">
    <span class="spinner h-4 w-4 shrink-0 rounded-full border-2 border-edge-hi border-t-accent-light"
    ></span>
    Extraction et vérification… (le web search peut prendre quelques secondes)
  </div>
{:else if claims !== null}
  <div class="mb-[0.8rem] flex items-baseline justify-between">
    <h2 class="m-0 text-[1.05rem]">
      {claims.length} claim{claims.length > 1 ? "s" : ""}
    </h2>
    <span class="text-[0.8rem] tabular-nums text-fg-faint">{(elapsed / 1000).toFixed(1)} s</span>
  </div>

  {#if debug}
    <div
      class="mb-[0.9rem] flex flex-wrap items-center gap-x-[0.6rem] gap-y-[0.4rem] rounded-lg border border-surface bg-[#0e0e1c] px-[0.85rem] py-[0.45rem] text-[0.78rem] text-fg-faint">
      <span class="flex items-center gap-[0.35rem]">
        <span class="text-fg-faint">Modèle</span>
        <code class="font-mono text-[0.74rem] text-[#8888b8]">{debug.model}</code>
      </span>
      <span class="text-surface-selected">·</span>
      <span class="flex items-center gap-[0.35rem]">
        <span class="text-fg-faint">Tours</span>
        <span
          class="rounded-full border px-[0.45rem] py-[0.1rem] text-[0.72rem] font-medium whitespace-nowrap {debug.turns ===
          2
            ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
            : 'border-green-500/20 bg-green-500/10 text-green-400'}">{debug.turns}</span>
      </span>
      <span class="text-surface-selected">·</span>
      <span class="flex items-center gap-[0.35rem]">
        <span class="text-fg-faint">Web search</span>
        <span
          class="rounded-full border px-[0.45rem] py-[0.1rem] text-[0.72rem] font-medium whitespace-nowrap {debug.web_search_called
            ? 'border-[rgba(99,179,237,0.2)] bg-[rgba(99,179,237,0.1)] text-[#63b3ed]'
            : 'border-[rgba(100,100,140,0.15)] bg-[rgba(100,100,140,0.1)] text-[#7070a0]'}">
          {debug.web_search_called ? "déclenchée" : "non utilisée"}
        </span>
      </span>
      <span class="text-surface-selected">·</span>
      <span class="flex items-center gap-[0.35rem]">
        <span class="text-fg-faint">Tokens</span>
        <span>{(debug.usage.input_tokens + debug.usage.output_tokens).toLocaleString()}</span>
      </span>
      {#if debug.usage.cache_read > 0}
        <span class="text-surface-selected">·</span>
        <span class="flex items-center gap-[0.35rem]">
          <span class="text-fg-faint">Cache hit</span>
          <span class="font-medium text-green-400">{cacheRatio(debug.usage)}</span>
        </span>
      {/if}
    </div>
  {/if}

  {#if claims.length === 0}
    <p
      class="rounded-[10px] border border-dashed border-edge bg-surface-alt p-[1.2rem] text-center text-[0.9rem] text-fg-muted">
      Aucun fait vérifiable trouvé dans ce texte.
    </p>
  {:else}
    <div class="claims">
      {#each claims as claim (claim.id)}
        <ClaimCard {claim} />
      {/each}
    </div>
  {/if}
{/if}

<style>
  /* The web-search toggle is a custom checkbox styled via sibling + :checked +
     nested selectors (input:checked + .track .thumb), which has no clean utility
     equivalent. The spinner needs keyframes. Both kept in CSS. */
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
    background: var(--color-edge);
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
    border-color: var(--color-accent);
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

  .spinner {
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
