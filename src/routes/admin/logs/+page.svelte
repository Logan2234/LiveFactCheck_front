<script lang="ts">
  import { AdminAuthError, adminJson } from "$lib/admin";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import { formatTime } from "$lib/utils/format";
  import { usePolling } from "$lib/utils/polling";
  import { tick } from "svelte";

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
      : entries.filter(
          (e) => (LEVEL_ORDER[e.level] ?? 0) >= (LEVEL_ORDER[filterLevel] ?? 0)
        )
  );

  async function poll() {
    try {
      const data = await adminJson<{ entries: LogEntry[] }>(
        `/admin/logs?after=${lastId}`
      );
      if (data.entries.length === 0) return;

      entries = [...entries, ...data.entries].slice(-MAX_DISPLAY);
      lastId = entries[entries.length - 1].id;
      error = "";

      if (autoScroll) {
        await tick();
        logBox?.scrollTo({ top: logBox.scrollHeight, behavior: "smooth" });
      }
    } catch (e) {
      if (e instanceof AdminAuthError) return;
      error = "Connexion perdue — nouvelle tentative…";
    }
  }

  function clearLogs() {
    // Keep lastId: the next poll then fetches only NEW logs. Resetting it to 0
    // would re-pull the whole server buffer 1.5 s later, undoing the clear.
    entries = [];
  }

  usePolling(() => void poll(), 1500);
</script>

<svelte:head>
  <title>Logs — Admin</title>
</svelte:head>

<PageHeader title="📜 Logs">
  Flux en direct du logger <code class="font-mono text-fg-muted">app.*</code> — rafraîchissement
  toutes les 1,5 s.
</PageHeader>

<div class="mb-3 flex flex-wrap items-center justify-between gap-3">
  <div class="flex items-center gap-2.5">
    <label for="filter" class="sr-only">Filtrer par niveau</label>
    <select
      id="filter"
      bind:value={filterLevel}
      class="cursor-pointer rounded-lg border border-surface-selected bg-surface-alt px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none">
      {#each LEVELS as l (l)}
        <option value={l}>{l}</option>
      {/each}
    </select>
    <span class="text-xs tabular-nums text-fg-faint"
      >{visible.length} entrée{visible.length !== 1 ? "s" : ""}</span>
  </div>
  <div class="flex items-center gap-2.5">
    <label
      class="flex cursor-pointer items-center gap-1.5 text-sm text-fg-muted select-none">
      <input
        type="checkbox"
        bind:checked={autoScroll}
        class="cursor-pointer accent-accent-light" />
      Auto-scroll
    </label>
    <Button
      variant="secondary"
      size="sm"
      onclick={clearLogs}
      disabled={entries.length === 0}>
      Vider
    </Button>
  </div>
</div>

{#if error}
  <div class="mb-3">
    <Alert type="error" message={error} />
  </div>
{/if}

<div
  class="h-[calc(100vh-260px)] min-h-75 overflow-y-auto rounded-xl border border-surface bg-surface-term px-4 py-3 font-mono text-xs leading-relaxed"
  bind:this={logBox}>
  {#if visible.length === 0}
    <div class="py-4 text-center text-sm text-edge-hi">
      Aucun log — les messages apparaîtront dès que le backend émet quelque
      chose.
    </div>
  {:else}
    {#each visible as entry (entry.id)}
      <div
        class="line level-{entry.level.toLowerCase()} grid grid-cols-[7ch_8ch_22ch_1fr] gap-3 rounded py-0.5 hover:bg-surface-raised">
        <span class="ts whitespace-nowrap text-edge-hi"
          >{formatTime(new Date(entry.t * 1000))}</span>
        <span class="lvl font-bold whitespace-nowrap">{entry.level}</span>
        <span
          class="logger overflow-hidden text-ellipsis whitespace-nowrap text-fg-faint"
          >{entry.logger}</span>
        <span class="msg break-all whitespace-pre-wrap text-fg-muted"
          >{entry.msg}</span>
      </div>
    {/each}
  {/if}
</div>

<style>
  /* Per-level colors use dynamic compound selectors — can't be expressed as utilities. */
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
