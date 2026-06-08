<script lang="ts">
  import { onMount, onDestroy, tick } from "svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";

  interface LogEntry {
    id: number;
    t: number;
    level: string;
    logger: string;
    msg: string;
  }

  const MAX_DISPLAY = 300;

  let entries = $state<LogEntry[]>([]);
  let lastId = $state(0);
  let error = $state("");
  let autoScroll = $state(true);
  let filterLevel = $state("ALL");
  let interval: ReturnType<typeof setInterval>;
  let logBox: HTMLDivElement;

  const LEVELS = ["ALL", "DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"];
  const LEVEL_ORDER: Record<string, number> = {
    DEBUG: 0,
    INFO: 1,
    WARNING: 2,
    ERROR: 3,
    CRITICAL: 4
  };

  let visible = $derived(
    filterLevel === "ALL"
      ? entries
      : entries.filter((e) => (LEVEL_ORDER[e.level] ?? 0) >= (LEVEL_ORDER[filterLevel] ?? 0))
  );

  function formatTime(ts: number): string {
    return new Date(ts * 1000).toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  }

  async function poll() {
    try {
      const res = await authFetch(`/admin/logs?after=${lastId}`);
      if (res.status === 401) {
        clearToken();
        return;
      }
      if (!res.ok) return;
      const data = await res.json();
      if (data.entries.length === 0) return;

      entries = [...entries, ...data.entries].slice(-MAX_DISPLAY);
      lastId = entries[entries.length - 1].id;
      error = "";

      if (autoScroll) {
        await tick();
        logBox?.scrollTo({ top: logBox.scrollHeight, behavior: "smooth" });
      }
    } catch {
      error = "Connexion perdue — nouvelle tentative…";
    }
  }

  function clearLogs() {
    entries = [];
    lastId = 0;
  }

  onMount(() => {
    poll();
    interval = setInterval(poll, 1500);
  });

  onDestroy(() => clearInterval(interval));
</script>

<svelte:head>
  <title>Logs — Admin</title>
</svelte:head>

<header>
  <div>
    <h1>📜 Logs</h1>
    <p>Flux en direct du logger <code>app.*</code> — rafraîchissement toutes les 1,5 s.</p>
  </div>
</header>

<div class="toolbar">
  <div class="toolbar-left">
    <label for="filter" class="sr-only">Filtrer par niveau</label>
    <select id="filter" bind:value={filterLevel}>
      {#each LEVELS as l}
        <option value={l}>{l}</option>
      {/each}
    </select>
    <span class="count">{visible.length} entrée{visible.length !== 1 ? "s" : ""}</span>
  </div>
  <div class="toolbar-right">
    <label class="toggle">
      <input type="checkbox" bind:checked={autoScroll} />
      Auto-scroll
    </label>
    <button class="ghost" onclick={clearLogs} disabled={entries.length === 0}>Vider</button>
  </div>
</div>

{#if error}
  <p class="error" role="alert">{error}</p>
{/if}

<div class="log-box" bind:this={logBox}>
  {#if visible.length === 0}
    <div class="empty">
      Aucun log — les messages apparaîtront dès que le backend émet quelque chose.
    </div>
  {:else}
    {#each visible as entry (entry.id)}
      <div class="line level-{entry.level.toLowerCase()}">
        <span class="ts">{formatTime(entry.t)}</span>
        <span class="lvl">{entry.level}</span>
        <span class="logger">{entry.logger}</span>
        <span class="msg">{entry.msg}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  header h1 {
    font-size: 1.4rem;
    margin: 0 0 0.3rem;
  }

  header p {
    color: #8888a0;
    font-size: 0.88rem;
    margin: 0 0 1.2rem;
  }

  header p code {
    font-family: "SF Mono", "Fira Code", monospace;
    color: #9a9ac0;
    font-size: 0.85em;
  }

  .toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
    flex-wrap: wrap;
  }

  .toolbar-left,
  .toolbar-right {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
  }

  select {
    background: #1a1a2e;
    border: 1px solid #2e2e4e;
    border-radius: 7px;
    color: #c8c8e8;
    font-size: 0.82rem;
    padding: 0.35rem 0.65rem;
    cursor: pointer;
  }

  select:focus {
    outline: none;
    border-color: #6a6acc;
  }

  .count {
    font-size: 0.78rem;
    color: #5a5a78;
    font-variant-numeric: tabular-nums;
  }

  .toggle {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.8rem;
    color: #8888a8;
    cursor: pointer;
    user-select: none;
  }

  .toggle input {
    accent-color: #7a7ad0;
    cursor: pointer;
  }

  .ghost {
    background: #1e1e30;
    color: #b0b0c8;
    border: 1px solid #2e2e3e;
    border-radius: 7px;
    padding: 0.35rem 0.75rem;
    font-size: 0.8rem;
    cursor: pointer;
    transition: background 0.15s;
  }

  .ghost:hover:not(:disabled) {
    background: #26263a;
  }

  .ghost:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #fca5a5;
    border-radius: 8px;
    padding: 0.6rem 0.9rem;
    font-size: 0.82rem;
    margin-bottom: 0.75rem;
  }

  .log-box {
    background: #080810;
    border: 1px solid #1e1e2e;
    border-radius: 10px;
    padding: 0.75rem 1rem;
    height: calc(100vh - 260px);
    min-height: 300px;
    overflow-y: auto;
    font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
    font-size: 0.78rem;
    line-height: 1.55;
  }

  .empty {
    color: #3a3a5a;
    font-size: 0.82rem;
    padding: 1rem 0;
    text-align: center;
    font-family: inherit;
  }

  .line {
    display: grid;
    grid-template-columns: 7ch 8ch 22ch 1fr;
    gap: 0.75rem;
    padding: 0.1rem 0;
    border-radius: 3px;
  }

  .line:hover {
    background: rgba(255, 255, 255, 0.03);
  }

  .ts {
    color: #3a3a5a;
    white-space: nowrap;
  }
  .lvl {
    font-weight: 700;
    white-space: nowrap;
  }
  .logger {
    color: #5a5a88;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .msg {
    color: #c0c0d8;
    word-break: break-all;
    white-space: pre-wrap;
  }

  .level-debug .lvl {
    color: #5a5a88;
  }
  .level-info .lvl {
    color: #4a9eff;
  }
  .level-warning .lvl {
    color: #f59e0b;
  }
  .level-warning .msg {
    color: #d4a850;
  }
  .level-error .lvl {
    color: #ef4444;
  }
  .level-error .msg {
    color: #fca5a5;
  }
  .level-critical .lvl {
    color: #ff2020;
  }
  .level-critical .msg {
    color: #ff8080;
  }
</style>
