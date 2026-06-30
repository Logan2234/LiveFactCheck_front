<script lang="ts">
  import { resolve } from "$app/paths";
  import { AdminAuthError } from "$lib/admin";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import {
    downloadSession,
    listSessions,
    type ExportFormat,
    type SessionSummary
  } from "$lib/sessions";
  import { formatCost, formatDateTime } from "$lib/utils/format";
  import { onMount } from "svelte";

  let sessions = $state<SessionSummary[]>([]);
  let error = $state("");
  let loading = $state(true);

  async function load() {
    loading = true;
    try {
      sessions = await listSessions();
      error = "";
    } catch (e) {
      if (e instanceof AdminAuthError) return; // token cleared → redirect
      error = e instanceof Error ? e.message : "Erreur inconnue";
    } finally {
      loading = false;
    }
  }

  async function exportSession(id: string, format: ExportFormat) {
    try {
      await downloadSession(id, format);
    } catch (e) {
      error = e instanceof Error ? e.message : "Échec de l'export";
    }
  }

  onMount(load);
</script>

<svelte:head>
  <title>Sessions — Admin</title>
</svelte:head>

<PageHeader
  title="Sessions"
  subtitle="Historique des sessions persistées — transcript, claims et statistiques.">
  {#snippet actions()}
    <Button onclick={load} variant="secondary" size="sm">↻ Rafraîchir</Button>
  {/snippet}
</PageHeader>

{#if error}
  <Alert type="error" message={error} />
{/if}

{#if loading}
  <p class="text-sm text-fg-faint">Chargement…</p>
{:else if sessions.length === 0}
  <EmptyState icon="📭" message="Aucune session enregistrée pour le moment." />
{:else}
  <div class="overflow-x-auto rounded-xl border border-edge">
    <table class="w-full border-collapse text-sm">
      <thead>
        <tr class="border-b border-edge bg-surface-alt text-left text-fg-muted">
          <th class="px-4 py-2.5 font-medium">Début</th>
          <th class="px-4 py-2.5 font-medium">État</th>
          <th class="px-4 py-2.5 font-medium">Client</th>
          <th class="px-4 py-2.5 text-right font-medium">Transcripts</th>
          <th class="px-4 py-2.5 text-right font-medium">Claims</th>
          <th class="px-4 py-2.5 text-right font-medium">Faux</th>
          <th class="px-4 py-2.5 text-right font-medium">Coût est.</th>
          <th class="px-4 py-2.5 font-medium">Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each sessions as s (s.id)}
          <tr
            class="border-b border-surface-raised last:border-0 hover:bg-surface">
            <td class="px-4 py-2.5">
              <a
                class="text-accent-light no-underline hover:underline"
                href={resolve("/admin/sessions/[id]", { id: s.id })}>
                {formatDateTime(s.started_at)}
              </a>
            </td>
            <td class="px-4 py-2.5">
              {#if s.active}
                <span
                  class="rounded-full border border-green-400/25 bg-green-400/12 px-2 py-0.5 text-2xs font-medium text-green-400">
                  active
                </span>
              {:else}
                <span class="text-fg-faint">terminée</span>
              {/if}
            </td>
            <td class="px-4 py-2.5 font-mono text-xs">{s.client_host}</td>
            <td class="px-4 py-2.5 text-right tabular-nums"
              >{s.transcripts_count}</td>
            <td class="px-4 py-2.5 text-right tabular-nums"
              >{s.claims_count}</td>
            <td class="px-4 py-2.5 text-right tabular-nums">
              <span class={s.false_count > 0 ? "text-red-400" : "text-fg-faint"}
                >{s.false_count}</span>
            </td>
            <td class="px-4 py-2.5 text-right tabular-nums text-fg-muted"
              >{formatCost(s.estimated_cost_usd)}</td>
            <td class="px-4 py-2.5">
              <div class="flex gap-1.5">
                <Button
                  onclick={() => exportSession(s.id, "md")}
                  variant="secondary"
                  size="xs">MD</Button>
                <Button
                  onclick={() => exportSession(s.id, "json")}
                  variant="secondary"
                  size="xs">JSON</Button>
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
