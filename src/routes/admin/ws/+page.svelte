<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";

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
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  }

  async function poll() {
    try {
      const res = await authFetch("/admin/ws/status");
      if (res.status === 401) { clearToken(); return; }
      if (!res.ok) { error = `Erreur ${res.status}`; return; }
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

<header>
  <div>
    <h1>🔌 WebSockets</h1>
    <p>Connexions actives — rafraîchissement toutes les 2 s.</p>
  </div>
  {#if lastPoll}
    <span class="last-poll">Mis à jour à {lastPoll.toLocaleTimeString("fr-FR")}</span>
  {/if}
</header>

{#if error}
  <p class="error" role="alert">{error}</p>
{/if}

{#if data}
  <!-- Métriques globales -->
  <div class="metrics">
    <div class="metric">
      <span class="metric-label">Connexions actives</span>
      <span class="metric-val {data.active.length > 0 ? 'live' : ''}">
        {#if data.active.length > 0}
          <span class="pulse"></span>
        {/if}
        {data.active.length}
      </span>
    </div>
    <div class="metric">
      <span class="metric-label">Total depuis démarrage</span>
      <span class="metric-val">{data.total_since_start}</span>
    </div>
    {#if data.active.length > 0}
      <div class="metric">
        <span class="metric-label">Tasks Claude en cours</span>
        <span class="metric-val">
          {data.active.reduce((acc, s) => acc + s.active_tasks, 0)}
        </span>
      </div>
    {/if}
  </div>

  <!-- Sessions actives -->
  {#if data.active.length === 0}
    <div class="empty">
      <span class="empty-icon">🔇</span>
      <span>Aucune connexion active — l'application live n'est pas ouverte.</span>
    </div>
  {:else}
    <div class="sessions">
      {#each data.active as session (session.id)}
        <div class="session-card">
          <div class="session-header">
            <div class="session-id">
              <span class="dot dot-live"></span>
              <code>{session.id.slice(0, 8)}</code>
            </div>
            <span class="connected-since">connecté depuis {formatDuration(session.connected_at)}</span>
          </div>

          <dl>
            <div class="row">
              <dt>Client IP</dt>
              <dd class="mono">{session.client}</dd>
            </div>
            <div class="row">
              <dt>Connecté à</dt>
              <dd class="mono">{formatTime(session.connected_at)}</dd>
            </div>
            <div class="row">
              <dt>Chunks audio reçus</dt>
              <dd>{session.chunks_received}</dd>
            </div>
            <div class="row">
              <dt>Transcriptions</dt>
              <dd>{session.transcripts}</dd>
            </div>
            <div class="row">
              <dt>Claims lancés</dt>
              <dd>{session.claims_spawned}</dd>
            </div>
            <div class="row">
              <dt>Tasks Claude actives</dt>
              <dd>
                {#if session.active_tasks > 0}
                  <span class="badge badge-active">{session.active_tasks} en cours</span>
                {:else}
                  <span class="dim">0</span>
                {/if}
              </dd>
            </div>
            <div class="row">
              <dt>Inactivité</dt>
              <dd class="{session.idle_s > 30 ? 'idle-warn' : ''}">
                {session.idle_s} s
              </dd>
            </div>
          </dl>

          {#if session.last_transcript}
            <div class="last-transcript">
              <span class="lt-label">Dernier transcript</span>
              <span class="lt-text">{session.last_transcript}{session.last_transcript.length >= 120 ? "…" : ""}</span>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
{/if}

<style>
  header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
  }

  header h1 { font-size: 1.4rem; margin: 0 0 0.3rem; }
  header p { color: #8888a0; font-size: 0.88rem; margin: 0; }

  .last-poll {
    font-size: 0.75rem;
    color: #4a4a68;
    align-self: flex-end;
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.35);
    color: #fca5a5;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .metrics {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1.25rem;
  }

  .metric {
    background: #161624;
    border: 1px solid #2e2e3e;
    border-radius: 10px;
    padding: 0.65rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 130px;
  }

  .metric-label { font-size: 0.72rem; color: #7a7a98; }

  .metric-val {
    font-size: 1rem;
    color: #e0e0f8;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }

  .metric-val.live { color: #4ade80; }

  .pulse {
    width: 8px;
    height: 8px;
    background: #22c55e;
    border-radius: 50%;
    box-shadow: 0 0 0 0 rgba(34,197,94,0.6);
    animation: pulse 1.4s ease-out infinite;
    flex-shrink: 0;
  }

  @keyframes pulse {
    0%   { box-shadow: 0 0 0 0 rgba(34,197,94,0.6); }
    70%  { box-shadow: 0 0 0 8px rgba(34,197,94,0); }
    100% { box-shadow: 0 0 0 0 rgba(34,197,94,0); }
  }

  .empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 3rem 1rem;
    color: #4a4a68;
    font-size: 0.88rem;
    background: #0e0e1c;
    border: 1px dashed #2e2e3e;
    border-radius: 12px;
    text-align: center;
  }

  .empty-icon { font-size: 1.8rem; }

  .sessions {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
    gap: 1rem;
  }

  .session-card {
    background: #161624;
    border: 1px solid #2e2e3e;
    border-radius: 12px;
    padding: 1rem 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 0.8rem;
  }

  .session-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 0.7rem;
    border-bottom: 1px solid #26263a;
    gap: 0.5rem;
  }

  .session-id {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .session-id code {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.82rem;
    color: #9a9aff;
  }

  .connected-since {
    font-size: 0.75rem;
    color: #5a5a78;
  }

  .dot-live {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34,197,94,0.5);
    flex-shrink: 0;
  }

  dl { margin: 0; display: flex; flex-direction: column; gap: 0.4rem; }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  dt { font-size: 0.78rem; color: #7a7a98; flex-shrink: 0; }
  dd { font-size: 0.82rem; color: #b0b0c8; margin: 0; }

  .mono {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.76rem;
  }

  .dim { color: #3a3a5a; }

  .idle-warn { color: #f59e0b; }

  .badge {
    border-radius: 999px;
    padding: 0.12rem 0.5rem;
    font-size: 0.73rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .badge-active {
    background: rgba(99,179,237,0.12);
    color: #63b3ed;
    border: 1px solid rgba(99,179,237,0.25);
  }

  .last-transcript {
    background: #0e0e1c;
    border: 1px solid #1e1e2e;
    border-radius: 8px;
    padding: 0.5rem 0.7rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .lt-label {
    font-size: 0.68rem;
    color: #4a4a68;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .lt-text {
    font-size: 0.8rem;
    color: #9090b8;
    font-style: italic;
    line-height: 1.4;
  }
</style>
