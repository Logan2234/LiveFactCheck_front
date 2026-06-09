<script lang="ts">
  import { authFetch, clearToken } from "$lib/stores/auth";
  import { onDestroy, onMount } from "svelte";

  interface HealthData {
    uptime_seconds: number;
    whisper: { model: string; device: string; loaded: boolean };
    anthropic: { model: string; api_key_set: boolean; api_key_hint: string };
    config: { log_level: string; jwt_expire_hours: number; max_claims_per_chunk: number };
    python_version: string;
    memory?: { rss_mb: number; vms_mb: number };
  }

  interface ConfigData {
    editable: { anthropic_model: string; log_level: string };
    options: { models: string[]; log_levels: string[] };
    readonly: {
      whisper_model: string;
      whisper_device: string;
      jwt_expire_hours: number;
      max_claims_per_chunk: number;
    };
    note: string;
  }

  let health = $state<HealthData | null>(null);
  let config = $state<ConfigData | null>(null);
  let loadError = $state("");
  let refreshing = $state(false);
  let lastRefresh = $state<Date | null>(null);

  let saving = $state(false);
  let saved = $state(false);
  let saveError = $state("");
  let draftModel = $state("");
  let draftLevel = $state("");

  let dirty = $derived(
    config !== null &&
      (draftModel !== config.editable.anthropic_model || draftLevel !== config.editable.log_level)
  );

  let interval: ReturnType<typeof setInterval>;

  function formatUptime(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    if (h > 0) return `${h}h ${m}m ${sec}s`;
    if (m > 0) return `${m}m ${sec}s`;
    return `${sec}s`;
  }

  function formatTime(d: Date): string {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  async function refreshHealth() {
    refreshing = true;
    try {
      const res = await authFetch("/admin/health");
      if (res.status === 401) {
        clearToken();
        return;
      }
      if (!res.ok) throw new Error(`Erreur HTTP ${res.status}`);
      health = await res.json();
      lastRefresh = new Date();
      loadError = "";
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Erreur réseau";
    } finally {
      refreshing = false;
    }
  }

  async function loadAll() {
    loadError = "";
    try {
      const [hRes, cRes] = await Promise.all([
        authFetch("/admin/health"),
        authFetch("/admin/config")
      ]);
      if (hRes.status === 401 || cRes.status === 401) {
        clearToken();
        return;
      }
      if (!hRes.ok) throw new Error(`Health: erreur ${hRes.status}`);
      if (!cRes.ok) throw new Error(`Config: erreur ${cRes.status}`);
      [health, config] = await Promise.all([hRes.json(), cRes.json()]);
      draftModel = config!.editable.anthropic_model;
      draftLevel = config!.editable.log_level;
      lastRefresh = new Date();
    } catch (e) {
      loadError = e instanceof Error ? e.message : "Erreur réseau";
    }
  }

  async function save() {
    if (!dirty || saving || !config) return;
    saving = true;
    saveError = "";
    try {
      const patch: Record<string, string> = {};
      if (draftModel !== config.editable.anthropic_model) patch.anthropic_model = draftModel;
      if (draftLevel !== config.editable.log_level) patch.log_level = draftLevel;

      const res = await authFetch("/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (res.status === 401) {
        clearToken();
        return;
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Erreur ${res.status}`);
      }
      config.editable.anthropic_model = draftModel;
      config.editable.log_level = draftLevel;
      saved = true;
      setTimeout(() => (saved = false), 2000);
    } catch (e) {
      saveError = e instanceof Error ? e.message : "Erreur réseau";
    } finally {
      saving = false;
    }
  }

  function reset() {
    if (!config) return;
    draftModel = config.editable.anthropic_model;
    draftLevel = config.editable.log_level;
  }

  onMount(() => {
    loadAll();
    interval = setInterval(refreshHealth, 30_000);
  });

  onDestroy(() => clearInterval(interval));
</script>

<svelte:head>
  <title>Système — Admin</title>
</svelte:head>

<header class="mb-6 flex flex-wrap items-start justify-between gap-4">
  <div>
    <h1 class="mt-0 mb-[0.3rem] text-[1.4rem]">🖥️ Système</h1>
    <p class="m-0 text-[0.88rem] text-fg-muted">
      État du serveur et configuration — rafraîchissement automatique toutes les 30 s.
    </p>
  </div>
  <div class="flex shrink-0 items-center gap-3">
    {#if lastRefresh}
      <span class="text-[0.78rem] tabular-nums text-fg-faint"
        >Mis à jour à {formatTime(lastRefresh)}</span>
    {/if}
    <button
      onclick={refreshHealth}
      disabled={refreshing}
      class="cursor-pointer rounded-lg border border-edge bg-surface px-[0.9rem] py-2 text-[0.82rem] font-medium text-slate-300 transition-all duration-150 enabled:hover:bg-surface-raised enabled:hover:text-fg disabled:cursor-not-allowed disabled:opacity-50">
      {refreshing ? "…" : "↺ Rafraîchir"}
    </button>
  </div>
</header>

{#if loadError}
  <p
    class="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-[0.9rem] py-[0.7rem] text-[0.85rem] text-red-300"
    role="alert">
    {loadError}
  </p>
{/if}

{#if !health && !loadError}
  <div class="flex items-center gap-[0.7rem] text-[0.9rem] text-fg-muted">
    <span
      class="spinner inline-block h-4 w-4 shrink-0 rounded-full border-2 border-edge-hi border-t-accent-light"
    ></span> Chargement…
  </div>
{/if}

{#if health}
  <!-- ── État ── -->
  <div class="mb-[0.6rem] text-[0.72rem] font-semibold tracking-[0.07em] text-fg-faint uppercase">
    État
  </div>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-[0.85rem]">
    <!-- Serveur -->
    <div class="rounded-xl border border-edge bg-surface-alt px-[1.1rem] py-4">
      <div
        class="mb-[0.85rem] flex items-center gap-2 border-b border-surface-raised pb-[0.6rem] text-[0.85rem] font-semibold text-slate-200">
        <span
          class="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
        ></span
        >Serveur
      </div>
      <dl class="m-0 flex flex-col gap-[0.45rem]">
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Uptime</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] font-semibold text-slate-100">
            {formatUptime(health.uptime_seconds)}
          </dd>
        </div>
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Python</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
            {health.python_version}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Whisper -->
    <div class="rounded-xl border border-edge bg-surface-alt px-[1.1rem] py-4">
      <div
        class="mb-[0.85rem] flex items-center gap-2 border-b border-surface-raised pb-[0.6rem] text-[0.85rem] font-semibold text-slate-200">
        <span
          class={[
            "h-2 w-2 shrink-0 rounded-full",
            health.whisper.loaded
              ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
              : "bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.5)]"
          ]}></span
        >Whisper
      </div>
      <dl class="m-0 flex flex-col gap-[0.45rem]">
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Modèle</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] font-semibold text-slate-100">
            {health.whisper.model}
          </dd>
        </div>
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Device</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
            {health.whisper.device}
          </dd>
        </div>
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Chargé</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
            {#if health.whisper.loaded}
              <span
                class="rounded-full border border-green-500/25 bg-green-500/12 px-2 py-[0.13rem] text-[0.72rem] font-medium whitespace-nowrap text-green-400"
                >Oui</span>
            {:else}
              <span
                class="rounded-full border border-amber-500/25 bg-amber-500/12 px-2 py-[0.13rem] text-[0.72rem] font-medium whitespace-nowrap text-amber-400"
                >Non</span>
            {/if}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Anthropic -->
    <div class="rounded-xl border border-edge bg-surface-alt px-[1.1rem] py-4">
      <div
        class="mb-[0.85rem] flex items-center gap-2 border-b border-surface-raised pb-[0.6rem] text-[0.85rem] font-semibold text-slate-200">
        <span
          class={[
            "h-2 w-2 shrink-0 rounded-full",
            health.anthropic.api_key_set
              ? "bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
              : "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.5)]"
          ]}></span
        >API Anthropic
      </div>
      <dl class="m-0 flex flex-col gap-[0.45rem]">
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Clé API</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
            {#if health.anthropic.api_key_set}
              <span
                class="rounded-full border border-green-500/25 bg-green-500/12 px-2 py-[0.13rem] text-[0.72rem] font-medium whitespace-nowrap text-green-400"
                >Configurée</span>
              <span class="font-mono text-[0.73rem] text-fg-faint"
                >{health.anthropic.api_key_hint}</span>
            {:else}
              <span
                class="rounded-full border border-red-500/25 bg-red-500/12 px-2 py-[0.13rem] text-[0.72rem] font-medium whitespace-nowrap text-red-400"
                >Manquante</span>
            {/if}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Mémoire -->
    {#if health.memory}
      <div class="rounded-xl border border-edge bg-surface-alt px-[1.1rem] py-4">
        <div
          class="mb-[0.85rem] flex items-center gap-2 border-b border-surface-raised pb-[0.6rem] text-[0.85rem] font-semibold text-slate-200">
          <span
            class="h-2 w-2 shrink-0 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]"
          ></span
          >Mémoire (processus)
        </div>
        <dl class="m-0 flex flex-col gap-[0.45rem]">
          <div class="flex min-w-0 items-center justify-between gap-2">
            <dt class="shrink-0 text-[0.78rem] text-fg-faint">RSS</dt>
            <dd
              class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] font-semibold text-slate-100">
              {health.memory.rss_mb} Mo
            </dd>
          </div>
          <div class="flex min-w-0 items-center justify-between gap-2">
            <dt class="shrink-0 text-[0.78rem] text-fg-faint">VMS</dt>
            <dd
              class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
              {health.memory.vms_mb} Mo
            </dd>
          </div>
        </dl>
      </div>
    {/if}
  </div>
{/if}

{#if config}
  <!-- ── Paramètres éditables ── -->
  <div
    class="mt-7 mb-[0.6rem] text-[0.72rem] font-semibold tracking-[0.07em] text-fg-faint uppercase">
    Paramètres
  </div>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-[0.85rem]">
    <div class="rounded-xl border border-edge bg-surface-alt px-[1.2rem] py-[1.1rem]">
      <div
        class="mb-[0.85rem] flex items-center gap-2 border-b border-surface-raised pb-[0.6rem] text-[0.85rem] font-semibold text-slate-200">
        Éditables
      </div>

      <div class="mb-[0.9rem] flex flex-col gap-[0.3rem]">
        <label for="model" class="text-[0.78rem] font-medium text-[#9a9ab8]"
          >Modèle Anthropic</label>
        <select
          id="model"
          bind:value={draftModel}
          class="cursor-pointer appearance-auto rounded-lg border border-edge-hi bg-[#0e0e1c] px-[0.7rem] py-[0.45rem] text-[0.86rem] text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none">
          {#each config.options.models as m}
            <option value={m}>{m}</option>
          {/each}
        </select>
        <span class="text-[0.72rem] text-fg-faint"
          >Appliqué immédiatement au prochain appel fact-check.</span>
      </div>

      <div class="mb-[0.9rem] flex flex-col gap-[0.3rem]">
        <label for="loglevel" class="text-[0.78rem] font-medium text-[#9a9ab8]"
          >Niveau de log</label>
        <select
          id="loglevel"
          bind:value={draftLevel}
          class="cursor-pointer appearance-auto rounded-lg border border-edge-hi bg-[#0e0e1c] px-[0.7rem] py-[0.45rem] text-[0.86rem] text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none">
          {#each config.options.log_levels as l}
            <option value={l}>{l}</option>
          {/each}
        </select>
        <span class="text-[0.72rem] text-fg-faint"
          >Modifie <code class="font-mono text-[#7a7aaa]">logging.getLogger("app")</code> en temps réel.</span>
      </div>

      {#if saveError}
        <p
          class="mt-2 mb-0 rounded-lg border border-red-500/35 bg-red-500/10 px-[0.7rem] py-[0.45rem] text-[0.8rem] text-red-300"
          role="alert">
          {saveError}
        </p>
      {/if}

      <div class="mt-4 flex justify-end gap-2">
        <button
          class="cursor-pointer rounded-lg border border-edge bg-surface px-[0.95rem] py-[0.48rem] text-[0.83rem] font-semibold text-slate-300 transition-all duration-150 enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
          onclick={reset}
          disabled={!dirty || saving}>Annuler</button>
        <button
          class="cursor-pointer rounded-lg border-none bg-[linear-gradient(135deg,#5a5ad0,#7a4ad0)] px-[0.95rem] py-[0.48rem] text-[0.83rem] font-semibold text-white transition-all duration-150 enabled:hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-40"
          onclick={save}
          disabled={!dirty || saving}>
          {#if saving}Enregistrement…{:else if saved}✓ Enregistré{:else}Enregistrer{/if}
        </button>
      </div>

      <p
        class="mt-[0.85rem] mb-0 rounded-md border border-[rgba(245,158,11,0.18)] bg-[rgba(245,158,11,0.07)] px-[0.7rem] py-[0.45rem] text-[0.75rem] text-[#7a6a3a]">
        ⚠ {config.note}
      </p>
    </div>

    <div class="rounded-xl border border-edge bg-surface-alt px-[1.2rem] py-[1.1rem]">
      <div
        class="mb-[0.85rem] flex items-center gap-2 border-b border-surface-raised pb-[0.6rem] text-[0.85rem] font-semibold text-slate-200">
        Lecture seule
      </div>
      <dl class="m-0 flex flex-col gap-[0.45rem]">
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Modèle Whisper</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
            {config.readonly.whisper_model}
          </dd>
        </div>
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Device Whisper</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
            {config.readonly.whisper_device}
          </dd>
        </div>
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">JWT expire</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
            {config.readonly.jwt_expire_hours} h
          </dd>
        </div>
        <div class="flex min-w-0 items-center justify-between gap-2">
          <dt class="shrink-0 text-[0.78rem] text-fg-faint">Max claims / chunk</dt>
          <dd
            class="m-0 flex flex-wrap items-center justify-end gap-[0.35rem] text-right text-[0.8rem] text-slate-300">
            {config.readonly.max_claims_per_chunk}
            <span
              class="rounded-full border border-[rgba(100,100,140,0.2)] bg-[rgba(100,100,140,0.12)] px-[0.4rem] py-[0.08rem] text-[0.68rem] text-fg-faint"
              >non utilisé</span>
          </dd>
        </div>
      </dl>
    </div>
  </div>
{/if}

<style>
  /* Loading spinner rotation — keyframes can't be expressed as utilities. */
  .spinner {
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
</style>
