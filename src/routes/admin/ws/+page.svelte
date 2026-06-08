<script lang="ts">
  import { authFetch, clearToken } from "$lib/stores/auth";
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

  function formatTime(ts: number): string {
    return new Date(ts * 1000).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
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
    poll();
    interval = setInterval(poll, 2000);
  });

  onDestroy(() => clearInterval(interval));
</script>

<svelte:head>
  <title>WebSockets — Admin</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
  <div>
    <h1 class="mt-0 mb-[0.3rem] text-[1.4rem]">🔌 WebSockets</h1>
    <p class="m-0 text-[0.88rem] text-fog-500">
      Connexions actives — rafraîchissement toutes les 2 s.
    </p>
  </div>
  {#if lastPoll}
    <span class="shrink-0 self-end text-xs tabular-nums text-ink-600"
      >Mis à jour à {lastPoll.toLocaleTimeString("fr-FR")}</span>
  {/if}
</header>

{#if error}
  <p
    class="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-[0.9rem] py-[0.7rem] text-[0.85rem] text-red-300"
    role="alert">
    {error}
  </p>
{/if}

{#if data}
  <!-- Métriques globales -->
  <div class="mb-5 flex flex-wrap gap-3">
    <div
      class="flex min-w-32.5 flex-col gap-[0.2rem] rounded-[10px] border border-ink-720 bg-ink-880 px-4 py-[0.65rem]">
      <span class="text-[0.72rem] text-fog-600">Connexions actives</span>
      <span
        class={[
          "flex items-center gap-[0.4rem] text-base font-semibold",
          data.active.length > 0 ? "text-green-400" : "text-fog-200"
        ]}>
        {#if data.active.length > 0}
          <span class="pulse h-2 w-2 shrink-0 rounded-full bg-green-500"></span>
        {/if}
        {data.active.length}
      </span>
    </div>
    <div
      class="flex min-w-32.5 flex-col gap-[0.2rem] rounded-[10px] border border-ink-720 bg-ink-880 px-4 py-[0.65rem]">
      <span class="text-[0.72rem] text-fog-600">Total depuis démarrage</span>
      <span class="flex items-center gap-[0.4rem] text-base font-semibold text-fog-200"
        >{data.total_since_start}</span>
    </div>
    {#if data.active.length > 0}
      <div
        class="flex min-w-32.5 flex-col gap-[0.2rem] rounded-[10px] border border-ink-720 bg-ink-880 px-4 py-[0.65rem]">
        <span class="text-[0.72rem] text-fog-600">Tasks Claude en cours</span>
        <span class="flex items-center gap-[0.4rem] text-base font-semibold text-fog-200">
          {data.active.reduce((acc, s) => acc + s.active_tasks, 0)}
        </span>
      </div>
    {/if}
  </div>

  <!-- Sessions actives -->
  {#if data.active.length === 0}
    <div
      class="flex flex-col items-center gap-[0.6rem] rounded-xl border border-dashed border-ink-720 bg-ink-950 px-4 py-12 text-center text-[0.88rem] text-ink-600">
      <span class="text-[1.8rem]">🔇</span>
      <span>Aucune connexion active — l'application live n'est pas ouverte.</span>
    </div>
  {:else}
    <div class="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-4">
      {#each data.active as session (session.id)}
        <div
          class="flex flex-col gap-[0.8rem] rounded-xl border border-ink-720 bg-ink-880 px-[1.2rem] py-4">
          <div class="flex items-center justify-between gap-2 border-b border-ink-780 pb-[0.7rem]">
            <div class="flex items-center gap-2">
              <span
                class="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
              ></span>
              <code class="font-mono text-[0.82rem] text-[#9a9aff]">{session.id.slice(0, 8)}</code>
            </div>
            <span class="text-xs text-ink-560"
              >connecté depuis {formatDuration(session.connected_at)}</span>
          </div>

          <dl class="m-0 flex flex-col gap-[0.4rem]">
            <div class="flex items-center justify-between gap-2">
              <dt class="shrink-0 text-[0.78rem] text-fog-600">Client IP</dt>
              <dd class="m-0 font-mono text-[0.76rem] text-fog-400">{session.client}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="shrink-0 text-[0.78rem] text-fog-600">Connecté à</dt>
              <dd class="m-0 font-mono text-[0.76rem] text-fog-400">
                {formatTime(session.connected_at)}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="shrink-0 text-[0.78rem] text-fog-600">Chunks audio reçus</dt>
              <dd class="m-0 text-[0.82rem] text-fog-400">{session.chunks_received}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="shrink-0 text-[0.78rem] text-fog-600">Transcriptions</dt>
              <dd class="m-0 text-[0.82rem] text-fog-400">{session.transcripts}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="shrink-0 text-[0.78rem] text-fog-600">Claims lancés</dt>
              <dd class="m-0 text-[0.82rem] text-fog-400">{session.claims_spawned}</dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="shrink-0 text-[0.78rem] text-fog-600">Tasks Claude actives</dt>
              <dd class="m-0 text-[0.82rem] text-fog-400">
                {#if session.active_tasks > 0}
                  <span
                    class="rounded-full border border-[rgba(99,179,237,0.25)] bg-[rgba(99,179,237,0.12)] px-2 py-[0.12rem] text-[0.73rem] font-medium whitespace-nowrap text-[#63b3ed]"
                    >{session.active_tasks} en cours</span>
                {:else}
                  <span class="text-ink-640">0</span>
                {/if}
              </dd>
            </div>
            <div class="flex items-center justify-between gap-2">
              <dt class="shrink-0 text-[0.78rem] text-fog-600">Inactivité</dt>
              <dd
                class={[
                  "m-0 text-[0.82rem]",
                  session.idle_s > 30 ? "text-amber-500" : "text-fog-400"
                ]}>
                {session.idle_s} s
              </dd>
            </div>
          </dl>

          {#if session.last_transcript}
            <div
              class="flex flex-col gap-[0.2rem] rounded-lg border border-ink-820 bg-ink-950 px-[0.7rem] py-2">
              <span class="text-[0.68rem] tracking-[0.04em] text-ink-600 uppercase"
                >Dernier transcript</span>
              <span class="text-[0.8rem] leading-[1.4] text-[#9090b8] italic"
                >{session.last_transcript}{session.last_transcript.length >= 120 ? "…" : ""}</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  /* Expanding box-shadow ping on the live-connection dot — keyframes only. */
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
