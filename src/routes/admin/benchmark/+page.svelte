<script lang="ts">
  import ClaimCard from "$lib/components/features/claims/ClaimCard.svelte";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
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

  function toClaim(raw: Partial<Claim>, i: number): Claim {
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
        return {
          claims: null,
          elapsed,
          error: detail?.detail ?? `Erreur ${res.status}`
        };
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

    const [r1, r2] = await Promise.allSettled([
      fetchSide(true),
      fetchSide(false)
    ]);
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
    if (!ran || withWeb.claims === null || withoutWeb.claims === null)
      return "";
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
  <h1 class="mt-0 mb-1 text-2xl">⚡ Benchmark</h1>
  <p class="mt-0 mb-6 text-sm text-fg-muted">
    Compare le même texte avec et sans recherche web en parallèle.
  </p>
</header>

<form onsubmit={run} class="mb-6">
  <textarea
    bind:value={text}
    rows="5"
    placeholder="Colle un texte à analyser…"
    disabled={loading}
    class="box-border w-full resize-y rounded-xl border border-edge bg-surface-alt px-4 py-3.5 font-[inherit] text-base leading-normal text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none disabled:opacity-50"
  ></textarea>
  <div class="mt-3 flex items-center gap-2">
    <Button
      variant="secondary"
      onclick={() => (text = "")}
      disabled={!text || loading}>
      Vider
    </Button>
    <Button type="submit" class="ml-auto" disabled={loading || !text.trim()}>
      {loading ? "Analyse en cours…" : "Comparer"}
    </Button>
  </div>
</form>

{#if loading}
  <div class="grid grid-cols-2 gap-5">
    - {#each ["🌐 Avec web search", "🧠 Sans web search"] as label (label)}
      <div class="flex min-w-0 flex-col gap-3">
        <div
          class="flex flex-wrap items-center gap-2 border-b border-edge pb-2 text-sm font-semibold text-fg">
          {label}
        </div>
        <div
          class="rounded-xl border border-dashed border-edge bg-surface-alt p-6">
          <LoadingSpinner message="Analyse…" />
        </div>
      </div>
    {/each}
  </div>
{:else if ran}
  {#if delta()}
    <div
      class="mb-4 rounded-lg border border-surface-selected bg-surface-raised px-4 py-2 text-center text-sm text-fg-muted">
      {delta()}
    </div>
  {/if}
  <div class="grid grid-cols-2 gap-5">
    {#each [{ label: "⚡ Avec web search", side: withWeb }, { label: "📝 Sans web search", side: withoutWeb }] as { label, side } (label)}
      <div class="flex min-w-0 flex-col gap-3">
        <div
          class="flex flex-wrap items-center gap-2 border-b border-edge pb-2 text-sm font-semibold text-fg">
          {label}
          <span
            class="rounded-full border border-edge-hi bg-surface-raised px-2 py-0.5 text-xs font-normal tabular-nums text-fg-muted">
            {(side.elapsed / 1000).toFixed(1)} s
          </span>
          {#if side.claims !== null}
            <span
              class="rounded-full border border-edge-hi bg-surface-raised px-2 py-0.5 text-xs font-normal tabular-nums text-fg-muted">
              {side.claims.length} claim{side.claims.length !== 1 ? "s" : ""}
            </span>
          {/if}
        </div>
        {#if side.error}
          <Alert type="error" message={side.error} />
        {:else if side.claims !== null && side.claims.length === 0}
          <p
            class="m-0 rounded-xl border border-dashed border-edge bg-surface-alt p-5 text-center text-sm text-fg-muted">
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
