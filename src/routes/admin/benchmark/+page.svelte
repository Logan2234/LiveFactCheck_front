<script lang="ts">
  import ClaimCard from "$lib/components/ClaimCard.svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";
  import type { Claim } from "$lib/stores/claims";

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
    withWeb =
      r1.status === "fulfilled"
        ? r1.value
        : { claims: null, elapsed: 0, error: "Erreur inattendue" };
    withoutWeb =
      r2.status === "fulfilled"
        ? r2.value
        : { claims: null, elapsed: 0, error: "Erreur inattendue" };
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
  <h1 class="mt-0 mb-[0.3rem] text-[1.4rem]">⚡ Benchmark</h1>
  <p class="mt-0 mb-6 text-[0.88rem] text-fg-muted">
    Compare le même texte avec et sans recherche web en parallèle.
  </p>
</header>

<form onsubmit={run} class="mb-6">
  <textarea
    bind:value={text}
    rows="5"
    placeholder="Colle un texte à analyser…"
    disabled={loading}
    class="box-border w-full resize-y rounded-[10px] border border-edge bg-surface-alt px-4 py-[0.9rem] font-[inherit] text-[0.95rem] leading-normal text-slate-100 transition-[border-color] duration-150 focus:border-accent focus:outline-none disabled:opacity-50"
  ></textarea>
  <div class="mt-3 flex items-center gap-2">
    <button
      type="button"
      class="cursor-pointer rounded-lg border border-edge bg-surface px-[1.1rem] py-[0.6rem] text-[0.88rem] font-medium text-slate-300 transition-[opacity,background] duration-150 enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
      onclick={() => (text = "")}
      disabled={!text || loading}>
      Vider
    </button>
    <span class="flex-1"></span>
    <button
      type="submit"
      disabled={loading || !text.trim()}
      class="cursor-pointer rounded-lg border-none bg-[linear-gradient(135deg,#5a5ad0,#7a4ad0)] px-[1.1rem] py-[0.6rem] text-[0.88rem] font-semibold text-white transition-[opacity,background] duration-150 enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
      {loading ? "Analyse en cours…" : "Comparer"}
    </button>
  </div>
</form>

{#if loading}
  <div class="grid grid-cols-2 gap-5">
    {#each ["🌐 Avec web search", "🧠 Sans web search"] as label}
      <div class="flex min-w-0 flex-col gap-3">
        <div
          class="flex flex-wrap items-center gap-2 border-b border-edge pb-2 text-[0.9rem] font-semibold text-slate-200">
          {label}
        </div>
        <div
          class="flex items-center gap-[0.7rem] rounded-[10px] border border-dashed border-edge bg-surface-alt p-6 text-[0.9rem] text-fg-muted">
          <span
            class="spinner h-4 w-4 shrink-0 rounded-full border-2 border-edge-hi border-t-accent-light"
          ></span> Analyse…
        </div>
      </div>
    {/each}
  </div>
{:else if ran}
  {#if delta()}
    <div
      class="mb-4 rounded-lg border border-surface-selected bg-[#1a1a30] px-4 py-[0.45rem] text-center text-[0.82rem] text-fg-muted">
      {delta()}
    </div>
  {/if}
  <div class="grid grid-cols-2 gap-5">
    {#each [{ label: "🌐 Avec web search", side: withWeb }, { label: "🧠 Sans web search", side: withoutWeb }] as { label, side }}
      <div class="flex min-w-0 flex-col gap-3">
        <div
          class="flex flex-wrap items-center gap-2 border-b border-edge pb-2 text-[0.9rem] font-semibold text-slate-200">
          {label}
          <span
            class="rounded-full border border-edge-hi bg-surface-raised px-[0.55rem] py-[0.15rem] text-[0.75rem] font-normal tabular-nums text-[#8888b0]"
            >{(side.elapsed / 1000).toFixed(1)} s</span>
          {#if side.claims !== null}
            <span
              class="rounded-full border border-edge-hi bg-surface-raised px-[0.55rem] py-[0.15rem] text-[0.75rem] font-normal tabular-nums text-[#8888b0]"
              >{side.claims.length} claim{side.claims.length !== 1 ? "s" : ""}</span>
          {/if}
        </div>
        {#if side.error}
          <p
            class="m-0 rounded-lg border border-red-500/35 bg-red-500/10 px-[0.9rem] py-[0.7rem] text-[0.85rem] text-red-300"
            role="alert">
            {side.error}
          </p>
        {:else if side.claims !== null && side.claims.length === 0}
          <p
            class="m-0 rounded-[10px] border border-dashed border-edge bg-surface-alt p-[1.2rem] text-center text-[0.9rem] text-fg-muted">
            Aucun fait vérifiable trouvé.
          </p>
        {:else if side.claims !== null}
          <div class="flex flex-col gap-3">
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
  /* Loading spinner rotation — keyframes can't be expressed as utilities. */
  .spinner {
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
