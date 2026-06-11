<script lang="ts">
  import Alert from "$lib/components/Alert.svelte";
  import Field from "$lib/components/Field.svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";
  import { formatDateTime, formatTime } from "$lib/utils/format";
  import { onDestroy, onMount } from "svelte";

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
  let interval: ReturnType<typeof setInterval>;

  function formatDuration(since: number): string {
    const s = Math.round(Date.now() / 1000 - since);
    if (s < 60) return `${s} s`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} min ${s % 60} s`;
    return `${Math.floor(m / 60)} h ${m % 60} min`;
  }

  async function poll() {
    try {
      const res = await authFetch("/admin/ws/status");
      if (res.status === 401) {
        clearToken();
        return;
      }
      if (!res.ok) {
        error = `Erreur ${res.status}`;
        return;
      }
      data = await res.json();
      error = "";
      lastPoll = new Date();
    } catch {
      error = "Connexion perdue";
    }
  }

  onMount(() => {
    void poll();
    interval = setInterval(() => void poll(), 2000);
  });

  onDestroy(() => clearInterval(interval));
</script>

<svelte:head>
  <title>WebSockets — Admin</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
  <div>
    <h1 class="mt-0 mb-1 text-2xl">🔌 WebSockets</h1>
    <p class="m-0 text-sm text-fg-muted">Connexions actives — rafraîchissement toutes les 2 s.</p>
  </div>
  {#if lastPoll}
    <span class="shrink-0 self-end text-xs tabular-nums text-fg-faint"
      >Mis à jour à {formatDateTime(lastPoll, { withSeconds: true })}</span>
  {/if}
</header>

{#if error}
  <Alert type="error" message={error} />
{/if}

{#if data}
  <!-- Métriques globales -->
  <div class="mb-5 flex flex-wrap gap-3">
    <div
      class="flex min-w-32.5 flex-col gap-1 rounded-xl border border-edge bg-surface-alt px-4 py-2.5">
      <span class="text-2xs text-fg-faint">Connexions actives</span>
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
    </div>
    <div
      class="flex min-w-32.5 flex-col gap-1 rounded-xl border border-edge bg-surface-alt px-4 py-2.5">
      <span class="text-2xs text-fg-faint">Total depuis démarrage</span>
      <span class="text-base font-semibold text-fg">{data.total_since_start}</span>
    </div>
    {#if data.active.length > 0}
      <div
        class="flex min-w-32.5 flex-col gap-1 rounded-xl border border-edge bg-surface-alt px-4 py-2.5">
        <span class="text-2xs text-fg-faint">Tasks Claude en cours</span>
        <span class="text-base font-semibold text-fg">
          {data.active.reduce((acc, s) => acc + s.active_tasks, 0)}
        </span>
      </div>
    {/if}
  </div>

  <!-- Sessions actives -->
  {#if data.active.length === 0}
    <div
      class="flex flex-col items-center gap-2.5 rounded-xl border border-dashed border-edge bg-surface-term px-4 py-12 text-center text-sm text-fg-faint">
      <span class="text-3xl">🔇</span>
      <span>Aucune connexion active — l'application live n'est pas ouverte.</span>
    </div>
  {:else}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
      {#each data.active as session (session.id)}
        <div class="flex flex-col gap-3 rounded-xl border border-edge bg-surface-alt px-5 py-4">
          <div class="flex items-center justify-between gap-2 border-b border-surface-raised pb-3">
            <div class="flex items-center gap-2">
              <span
                class="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
              ></span>
              <code class="font-mono text-sm text-accent-light">{session.id.slice(0, 8)}</code>
            </div>
            <span class="text-xs text-fg-faint"
              >connecté depuis {formatDuration(session.connected_at)}</span>
          </div>

          <dl class="m-0 flex flex-col gap-1.5">
            <Field label="Client IP"><span class="font-mono text-xs">{session.client}</span></Field>
            <Field label="Connecté à"
              ><span class="font-mono text-xs">{formatTime(session.connected_at * 1000)}</span
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
              <span class={session.idle_s > 30 ? "text-amber-500" : ""}>{session.idle_s} s</span>
            </Field>
          </dl>

          {#if session.last_transcript}
            <div
              class="flex flex-col gap-1 rounded-lg border border-surface bg-surface-term px-3 py-2">
              <span class="text-2xs tracking-wide text-fg-faint uppercase">Dernier transcript</span>
              <span class="text-xs leading-snug text-fg-muted italic">
                {session.last_transcript}{session.last_transcript.length >= 120 ? "…" : ""}
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
