<script lang="ts">
  import { authFetch, clearToken } from "$lib/stores/auth";
  import { onDestroy, onMount, tick } from "svelte";
  import AlertBanner from "$lib/components/AlertBanner.svelte";

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
    <h1 class="mt-0 mb-1 text-2xl">📜 Logs</h1>
    <p class="mt-0 mb-5 text-sm text-fg-muted">
      Flux en direct du logger <code class="font-mono text-fg-muted">app.*</code> — rafraîchissement
      toutes les 1,5 s.
    </p>
  </div>
</header>

<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
  <div class="flex items-center gap-2.5">
    <label for="filter" class="sr-only">Filtrer par niveau</label>
    <select
      id="filter"
      bind:value={filterLevel}
      class="cursor-pointer rounded-lg border border-surface-selected bg-surface-alt px-2.5 py-1.5 text-sm text-slate-200 focus:border-accent focus:outline-none">
      {#each LEVELS as l}
        <option value={l}>{l}</option>
      {/each}
    </select>
    <span class="text-xs tabular-nums text-fg-faint"
      >{visible.length} entrée{visible.length !== 1 ? "s" : ""}</span>
  </div>
  <div class="flex items-center gap-2.5">
    <label class="flex cursor-pointer items-center gap-1.5 text-sm text-fg-muted select-none">
      <input type="checkbox" bind:checked={autoScroll} class="cursor-pointer accent-accent-light" />
      Auto-scroll
    </label>
    <button
      class="cursor-pointer rounded-lg border border-edge bg-surface px-3 py-1.5 text-sm text-slate-300 transition-[background] duration-150 enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
      onclick={clearLogs}
      disabled={entries.length === 0}>Vider</button>
  </div>
</div>

{#if error}
  <div class="mb-3">
    <AlertBanner message={error} />
  </div>
{/if}

<div
  class="h-[calc(100vh-260px)] min-h-75 overflow-y-auto rounded-xl border border-surface bg-[#080810] px-4 py-3 font-mono text-xs leading-relaxed"
  bind:this={logBox}>
  {#if visible.length === 0}
    <div class="py-4 text-center text-sm text-edge-hi">
      Aucun log — les messages apparaîtront dès que le backend émet quelque chose.
    </div>
  {:else}
    {#each visible as entry (entry.id)}
      <div
        class="line level-{entry.level.toLowerCase()} grid grid-cols-[7ch_8ch_22ch_1fr] gap-3 rounded py-0.5 hover:bg-white/3">
        <span class="ts whitespace-nowrap text-edge-hi">{formatTime(entry.t)}</span>
        <span class="lvl font-bold whitespace-nowrap">{entry.level}</span>
        <span class="logger overflow-hidden text-ellipsis whitespace-nowrap text-fg-faint">{entry.logger}</span>
        <span class="msg break-all whitespace-pre-wrap text-fg-muted">{entry.msg}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  /* Per-level colors use dynamic compound selectors — can't be expressed as utilities. */
  .level-debug .lvl { color: #5a5a88; }
  .level-info .lvl { color: #4a9eff; }
  .level-warning .lvl { color: #f59e0b; }
  .level-warning .msg { color: #d4a850; }
  .level-error .lvl { color: #ef4444; }
  .level-error .msg { color: #fca5a5; }
  .level-critical .lvl { color: #ff2020; }
  .level-critical .msg { color: #ff8080; }
</style>
