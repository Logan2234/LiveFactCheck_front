<script lang="ts">
  import { AdminAuthError, adminJson } from "$lib/admin";
  import ClaimCard from "$lib/components/features/claims/ClaimCard.svelte";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import { makeClaim, type Claim } from "$lib/stores/claims";
  import { formatCost } from "$lib/utils/format";

  interface Usage {
    input_tokens: number;
    output_tokens: number;
    cache_write: number;
    cache_read: number;
  }

  interface DebugInfo {
    usage: Usage;
    model: string;
    estimated_cost_usd: number | null;
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

  interface ModelTestResponse {
    claims?: Partial<Claim>[];
    usage: Usage;
    model: string;
    estimated_cost_usd?: number | null;
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
      const data = await adminJson<ModelTestResponse>("/admin/model-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, web_search: webSearch })
      });
      claims = (data.claims ?? []).map((r, i) => makeClaim(r, `test-${i}`));
      debug = {
        usage: data.usage,
        model: data.model,
        estimated_cost_usd: data.estimated_cost_usd ?? null
      };
    } catch (err) {
      if (err instanceof AdminAuthError) return;
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

<PageHeader
  title="🧪 Test de la pipeline"
  subtitle="Envoie un texte directement à l'extraction + vérification de claims (POST /fact-check)." />

<form onsubmit={run} class="mb-6">
  <textarea
    bind:value={text}
    rows="6"
    placeholder="Colle ou écris un texte à analyser…"
    class="box-border w-full resize-y rounded-xl border border-edge bg-surface-alt px-4 py-3.5 font-[inherit] text-base leading-normal text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none"
  ></textarea>

  <div class="mt-3 flex items-center gap-2">
    <div class="relative">
      <Button
        variant="secondary"
        type="button"
        onclick={() => (menuOpen = !menuOpen)}>Exemples ▾</Button>
      {#if menuOpen}
        <button
          type="button"
          class="fixed inset-0 z-40 cursor-default bg-transparent p-0"
          aria-label="Fermer"
          onclick={() => (menuOpen = false)}></button>
        <ul
          class="absolute top-[calc(100%+0.4rem)] left-0 z-50 m-0 flex min-w-65 list-none flex-col gap-0.5 rounded-xl border border-edge bg-surface-alt p-1.5 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
          {#each examples as ex (ex.text)}
            <li>
              <button
                type="button"
                class="flex w-full cursor-pointer flex-col gap-0.5 rounded-lg bg-transparent px-2.5 py-2 text-left transition-[background] duration-120 hover:bg-surface-raised"
                onclick={() => loadExample(ex.text)}>
                <span class="text-sm font-medium text-fg">{ex.label}</span>
                <span class="text-2xs font-normal text-fg-faint"
                  >{ex.hint}</span>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    <label
      class="switch ml-auto"
      title="Activer / désactiver la recherche web pour cette analyse">
      <input type="checkbox" bind:checked={webSearch} />
      <span class="track"><span class="thumb"></span></span>
      <span class="switch-label">{webSearch ? "🌐 Web" : "🧠 Sans web"}</span>
    </label>
    <Button type="submit" disabled={loading || text.trim().length === 0}>
      {loading ? "Analyse en cours…" : "Analyser"}
    </Button>
  </div>
</form>

{#if error}
  <Alert type="error" message={error} />
{/if}

{#if loading}
  <div
    class="flex items-center gap-3 rounded-xl border border-dashed border-edge bg-surface-alt p-6 text-sm text-fg-muted">
    <span
      class="spinner h-4 w-4 shrink-0 rounded-full border-2 border-edge-hi border-t-accent-light"
    ></span>
    Extraction et vérification… (le web search peut prendre quelques secondes)
  </div>
{:else if claims !== null}
  <div class="mb-3 flex items-baseline justify-between">
    <h2 class="m-0 text-lg">
      {claims.length} claim{claims.length > 1 ? "s" : ""}
    </h2>
    <span class="text-sm tabular-nums text-fg-faint"
      >{(elapsed / 1000).toFixed(1)} s</span>
  </div>

  {#if debug}
    <div class="mb-3.5 flex flex-wrap gap-2 text-xs">
      <div
        class="flex items-center gap-1.5 rounded-lg border border-surface bg-surface-term px-3 py-1.5">
        <span class="text-fg-faint">Modèle</span>
        <code class="font-mono text-2xs text-fg-muted">{debug.model}</code>
      </div>
      <div
        class="flex items-center gap-1.5 rounded-lg border border-surface bg-surface-term px-3 py-1.5">
        <span class="text-fg-faint">Tokens</span>
        <span class="tabular-nums text-fg-muted"
          >{(
            debug.usage.input_tokens + debug.usage.output_tokens
          ).toLocaleString()}</span>
        <span class="text-2xs tabular-nums text-fg-faint">
          ({debug.usage.input_tokens.toLocaleString()} ↑ · {debug.usage.output_tokens.toLocaleString()}
          ↓)
        </span>
      </div>
      <div
        class="flex items-center gap-1.5 rounded-lg border border-surface bg-surface-term px-3 py-1.5"
        title="Coût estimé de cet appel (tarifs indicatifs)">
        <span class="text-fg-faint">Coût est.</span>
        <span class="font-medium tabular-nums text-fg-muted"
          >{formatCost(debug.estimated_cost_usd)}</span>
      </div>
      {#if debug.usage.cache_read > 0}
        <div
          class="flex items-center gap-1.5 rounded-lg border border-surface bg-surface-term px-3 py-1.5">
          <span class="text-fg-faint">Cache hit</span>
          <span class="font-medium text-green-400"
            >{cacheRatio(debug.usage)}</span>
        </div>
      {/if}
    </div>
  {/if}

  {#if claims.length === 0}
    <EmptyState
      variant="result"
      message="Aucun fait vérifiable trouvé dans ce texte." />
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
</style>
