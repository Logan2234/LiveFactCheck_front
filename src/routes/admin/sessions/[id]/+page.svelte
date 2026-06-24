<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { STATUS_META } from "$lib/constants/status";
  import {
    downloadSession,
    getSession,
    type ExportFormat,
    type SessionDetail
  } from "$lib/sessions";
  import { clearToken } from "$lib/stores/auth";
  import type { VerificationStatus } from "$lib/stores/claims";
  import { formatDateTime } from "$lib/utils/format";
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
      if (e instanceof Error && e.message.includes("401")) clearToken();
      else error = e instanceof Error ? e.message : "Erreur inconnue";
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
      { label: "Tokens (total)", value: s.tokens.total.toLocaleString("fr-FR") }
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
        value: `$${s.estimated_cost_usd.toFixed(6)}`
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
        <div
          class="flex flex-col gap-1 rounded-xl border border-edge bg-surface-alt px-4 py-2.5">
          <span class="text-2xs text-fg-faint">{row.label}</span>
          <span class="text-base font-semibold text-fg">{row.value}</span>
        </div>
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
          {@const meta = STATUS_META[claim.status as VerificationStatus]}
          <div
            class="rounded-xl border border-edge bg-surface-alt px-5 py-4"
            style="border-left: 3px solid {meta.color};">
            <div class="mb-1.5 flex items-center gap-2">
              <span aria-hidden="true">{meta.icon}</span>
              <span class="text-xs font-semibold" style="color: {meta.color};"
                >{meta.label}</span>
              {#if claim.category}
                <span class="text-2xs text-fg-faint">· {claim.category}</span>
              {/if}
              <span class="ml-auto text-2xs text-fg-faint"
                >confiance {claim.confidence}/10</span>
            </div>
            <p class="m-0 text-sm text-fg">{claim.text}</p>
            {#if claim.explanation}
              <p class="mt-1.5 mb-0 text-xs text-fg-muted">
                {claim.explanation}
              </p>
            {/if}
            {#if claim.counter_claim}
              <p class="mt-1.5 mb-0 text-xs text-red-300">
                <strong>Correction :</strong>
                {claim.counter_claim}
              </p>
            {/if}
            {#if claim.sources.length > 0}
              <ul
                class="mt-2 mb-0 flex flex-col gap-0.5 pl-4 text-2xs text-fg-faint">
                {#each claim.sources as src (src)}
                  <li>
                    <a
                      href={src}
                      target="_blank"
                      rel="noopener noreferrer external"
                      class="text-accent-light no-underline hover:underline"
                      >{src}</a>
                  </li>
                {/each}
              </ul>
            {/if}
          </div>
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
