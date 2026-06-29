<script lang="ts">
  import { AdminAuthError, adminJson } from "$lib/admin";
  import Alert from "$lib/components/ui/Alert.svelte";
  import EmptyState from "$lib/components/ui/EmptyState.svelte";
  import Field from "$lib/components/ui/Field.svelte";
  import Metric from "$lib/components/ui/Metric.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import {
    formatDateTime,
    formatDuration,
    formatTime
  } from "$lib/utils/format";
  import { usePolling } from "$lib/utils/polling";

  interface Session {
    id: string;
    connected_at: number;
    client: string;
    chunks_received: number;
    transcripts: number;
    claims_spawned: number;
    active_tasks: number;
    last_transcript: string;
    idle_s: number;
  }

  interface StatusData {
    active: Session[];
    total_since_start: number;
  }

  let data = $state<StatusData | null>(null);
  let error = $state("");
  let lastPoll = $state<Date | null>(null);

  async function poll() {
    try {
      data = await adminJson<StatusData>("/admin/ws/status");
      error = "";
      lastPoll = new Date();
    } catch (e) {
      if (e instanceof AdminAuthError) return;
      error = e instanceof Error ? e.message : "Connexion perdue";
    }
  }

  usePolling(() => void poll(), 2000);
</script>

<svelte:head>
  <title>WebSockets — Admin</title>
</svelte:head>

<PageHeader
  title="🔌 WebSockets"
  subtitle="Connexions actives — rafraîchissement toutes les 2 s.">
  {#snippet actions()}
    {#if lastPoll}
      <span class="text-xs tabular-nums text-fg-faint"
        >Mis à jour à {formatDateTime(lastPoll, { withSeconds: true })}</span>
    {/if}
  {/snippet}
</PageHeader>

{#if error}
  <Alert type="error" message={error} />
{/if}

{#if data}
  <!-- Métriques globales -->
  <div class="mb-5 flex flex-wrap gap-3">
    <Metric label="Connexions actives">
      <span
        class={[
          "flex items-center gap-1.5 text-base font-semibold",
          data.active.length > 0 ? "text-green-400" : "text-fg"
        ]}>
        {#if data.active.length > 0}
          <span class="pulse h-2 w-2 shrink-0 rounded-full bg-green-500"></span>
        {/if}
        {data.active.length}
      </span>
    </Metric>
    <Metric label="Total depuis démarrage" value={data.total_since_start} />
    {#if data.active.length > 0}
      <Metric
        label="Tasks Claude en cours"
        value={data.active.reduce((acc, s) => acc + s.active_tasks, 0)} />
    {/if}
  </div>

  <!-- Sessions actives -->
  {#if data.active.length === 0}
    <EmptyState
      icon="🔇"
      message="Aucune connexion active — l'application live n'est pas ouverte." />
  {:else}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
      {#each data.active as session (session.id)}
        <div
          class="flex flex-col gap-3 rounded-xl border border-edge bg-surface-alt px-5 py-4">
          <div
            class="flex items-center justify-between gap-2 border-b border-surface-raised pb-3">
            <div class="flex items-center gap-2">
              <span
                class="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
              ></span>
              <code class="font-mono text-sm text-accent-light"
                >{session.id.slice(0, 8)}</code>
            </div>
            <span class="text-xs text-fg-faint"
              >connecté depuis {formatDuration(session.connected_at)}</span>
          </div>

          <dl class="m-0 flex flex-col gap-1.5">
            <Field label="Client IP"
              ><span class="font-mono text-xs">{session.client}</span></Field>
            <Field label="Connecté à"
              ><span class="font-mono text-xs"
                >{formatTime(session.connected_at * 1000)}</span
              ></Field>
            <Field label="Chunks audio reçus">{session.chunks_received}</Field>
            <Field label="Transcriptions">{session.transcripts}</Field>
            <Field label="Claims lancés">{session.claims_spawned}</Field>
            <Field label="Tasks Claude actives">
              {#if session.active_tasks > 0}
                <span
                  class="rounded-full border border-blue-400/25 bg-blue-400/12 px-2 py-0.5 text-2xs font-medium whitespace-nowrap text-blue-400">
                  {session.active_tasks} en cours
                </span>
              {:else}
                <span class="text-fg-faint">0</span>
              {/if}
            </Field>
            <Field label="Inactivité">
              <span class={session.idle_s > 30 ? "text-amber-500" : ""}
                >{session.idle_s} s</span>
            </Field>
          </dl>

          {#if session.last_transcript}
            <div
              class="flex flex-col gap-1 rounded-lg border border-surface bg-surface-term px-3 py-2">
              <span class="text-2xs tracking-wide text-fg-faint uppercase"
                >Dernier transcript</span>
              <span class="text-xs leading-snug text-fg-muted italic">
                {session.last_transcript}{session.last_transcript.length >= 120
                  ? "…"
                  : ""}
              </span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  /* Expanding ping on the live-connection dot. */
  .pulse {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
    animation: pulse 1.4s ease-out infinite;
  }

  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.6);
    }
    70% {
      box-shadow: 0 0 0 8px rgba(34, 197, 94, 0);
    }
    100% {
      box-shadow: 0 0 0 0 rgba(34, 197, 94, 0);
    }
  }
</style>
