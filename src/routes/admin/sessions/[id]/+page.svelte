<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import { AdminAuthError } from "$lib/admin";
  import ClaimCard from "$lib/components/features/claims/ClaimCard.svelte";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Metric from "$lib/components/ui/Metric.svelte";
  import {
    downloadSession,
    getSession,
    type ExportFormat,
    type SessionDetail
  } from "$lib/sessions";
  import { formatCost, formatDateTime } from "$lib/utils/format";
  import { onMount } from "svelte";

  const id = page.params.id ?? "";

  let detail = $state<SessionDetail | null>(null);
  let error = $state("");
  let loading = $state(true);

  async function load() {
    loading = true;
    try {
      detail = await getSession(id);
      error = "";
    } catch (e) {
      if (e instanceof AdminAuthError) return; // token cleared → redirect
      error = e instanceof Error ? e.message : "Erreur inconnue";
    } finally {
      loading = false;
    }
  }

  async function exportSession(format: ExportFormat) {
    try {
      await downloadSession(id, format);
    } catch (e) {
      error = e instanceof Error ? e.message : "Échec de l'export";
    }
  }

  // Flatten stats into labelled rows for a compact grid; null/empty are skipped.
  let statRows = $derived.by<{ label: string; value: string }[]>(() => {
    if (!detail) return [];
    const s = detail.stats;
    const rows: { label: string; value: string }[] = [
      { label: "Transcriptions", value: String(s.transcripts_count) },
      { label: "Claims", value: String(s.claims_count) },
      { label: "Rejets", value: String(s.rejects) },
      { label: "Appels API", value: String(s.api_calls_total) },
      { label: "Fallbacks", value: String(s.fallback_count) },
      { label: "Recherches web", value: String(s.web_search_calls_total) },
      { label: "Tokens (total)", value: s.tokens.total.toLocaleString() }
    ];
    if (s.duration_s !== null)
      rows.push({ label: "Durée", value: `${s.duration_s} s` });
    if (s.dominant_category)
      rows.push({ label: "Catégorie dominante", value: s.dominant_category });
    if (s.avg_confidence !== null)
      rows.push({ label: "Confiance moy.", value: `${s.avg_confidence}/10` });
    if (s.avg_transcribe_ms !== null)
      rows.push({
        label: "Latence transcription",
        value: `${s.avg_transcribe_ms} ms`
      });
    if (s.avg_verify_ms !== null)
      rows.push({ label: "Latence vérif.", value: `${s.avg_verify_ms} ms` });
    if (s.estimated_cost_usd !== null)
      rows.push({
        label: `Coût est. (${s.pricing_model})`,
        value: formatCost(s.estimated_cost_usd, 6)
      });
    return rows;
  });

  onMount(load);
</script>

<svelte:head>
  <title>Session {id.slice(0, 8)} — Admin</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
  <div>
    <a
      class="text-xs text-fg-faint no-underline hover:text-fg-muted"
      href={resolve("/admin/sessions")}>↩ Toutes les sessions</a>
    <h1 class="mt-1 mb-1 text-2xl">
      🗂️ Session <code class="font-mono text-lg text-accent-light"
        >{id.slice(0, 8)}</code>
    </h1>
    {#if detail}
      <p class="m-0 text-sm text-fg-muted">
        {formatDateTime(detail.started_at)} · {detail.client_host}
        {#if detail.active}
          <span class="text-green-400"> · active</span>
        {/if}
      </p>
    {/if}
  </div>
  {#if detail}
    <div class="flex gap-1.5">
      <Button onclick={() => exportSession("md")} variant="secondary" size="sm"
        >Export MD</Button>
      <Button
        onclick={() => exportSession("json")}
        variant="secondary"
        size="sm">Export JSON</Button>
    </div>
  {/if}
</header>

{#if error}
  <Alert type="error" message={error} />
{/if}

{#if loading}
  <p class="text-sm text-fg-faint">Chargement…</p>
{:else if detail}
  <!-- Statistiques -->
  <section class="mb-8">
    <h2 class="mt-0 mb-3 text-lg">Statistiques</h2>
    <div class="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-3">
      {#each statRows as row (row.label)}
        <Metric label={row.label} value={row.value} />
      {/each}
    </div>
  </section>

  <!-- Claims -->
  <section class="mb-8">
    <h2 class="mt-0 mb-3 text-lg">Claims ({detail.claims.length})</h2>
    {#if detail.claims.length === 0}
      <p class="text-sm text-fg-faint">Aucun claim.</p>
    {:else}
      <div class="flex flex-col gap-3">
        {#each detail.claims as claim (claim.id)}
          <ClaimCard {claim} interactive={false} />
        {/each}
      </div>
    {/if}
  </section>

  <!-- Transcript -->
  <section>
    <h2 class="mt-0 mb-3 text-lg">Transcript ({detail.segments.length})</h2>
    {#if detail.segments.length === 0}
      <p class="text-sm text-fg-faint">Aucune transcription.</p>
    {:else}
      <ol
        class="m-0 flex flex-col gap-1.5 rounded-xl border border-edge bg-surface-term p-4 text-sm">
        {#each detail.segments as seg (seg.id)}
          <li class="flex gap-2">
            <span class="shrink-0 font-mono text-2xs text-fg-faint"
              >{seg.seq + 1}.</span>
            <span class="text-fg-muted">{seg.text}</span>
          </li>
        {/each}
      </ol>
    {/if}
  </section>
{/if}
