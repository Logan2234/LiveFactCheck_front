<script lang="ts">
  import { AdminAuthError, adminJson } from "$lib/admin";
  import ClaimCard from "$lib/components/features/claims/ClaimCard.svelte";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import { makeClaim, type Claim } from "$lib/stores/claims";

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

  async function fetchSide(web_search: boolean): Promise<Side> {
    const start = performance.now();
    try {
      const data = await adminJson<{ claims?: Partial<Claim>[] }>(
        "/fact-check",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, web_search })
        }
      );
      return {
        claims: (data.claims ?? []).map((r, i) => makeClaim(r, `bench-${i}`)),
        elapsed: Math.round(performance.now() - start),
        error: ""
      };
    } catch (e) {
      const elapsed = Math.round(performance.now() - start);
      if (e instanceof AdminAuthError)
        return { claims: null, elapsed, error: "Session expirée" };
      return {
        claims: null,
        elapsed,
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

<PageHeader
  title="Benchmark"
  subtitle="Compare le même texte avec et sans recherche web en parallèle." />

<form onsubmit={run} class="mb-6">
  <textarea
    bind:value={text}
    rows="5"
    placeholder="Colle un texte à analyser…"
    disabled={loading}
    class="box-border w-full resize-y rounded-xl border border-edge bg-surface-alt px-4 py-3.5 font-[inherit] text-base leading-normal text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none disabled:opacity-50"
  ></textarea>
  <div class="mt-3 flex items-center">
    <Button type="submit" class="ml-auto" disabled={loading || !text.trim()}>
      {loading ? "Analyse en cours…" : "Comparer"}
    </Button>
  </div>
</form>

{#if loading}
  <div class="grid grid-cols-2 gap-5">
    {#each ["🌐 Avec web search", "🧠 Sans web search"] as label (label)}
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
          <EmptyState
            variant="result"
            message="Aucun fait vérifiable trouvé." />
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
