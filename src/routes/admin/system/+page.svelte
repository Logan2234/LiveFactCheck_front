<script lang="ts">
  import { authFetch, clearToken } from "$lib/stores/auth";
  import { onDestroy, onMount } from "svelte";
  import AlertBanner from "$lib/components/AlertBanner.svelte";
  import Field from "$lib/components/Field.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import StatCard from "$lib/components/StatCard.svelte";
  import StatusBadge from "$lib/components/StatusBadge.svelte";

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
    <h1 class="mt-0 mb-1 text-2xl">🖥️ Système</h1>
    <p class="m-0 text-sm text-fg-muted">
      État du serveur et configuration — rafraîchissement automatique toutes les 30 s.
    </p>
  </div>
  <div class="flex shrink-0 items-center gap-3">
    {#if lastRefresh}
      <span class="text-xs tabular-nums text-fg-faint">Mis à jour à {formatTime(lastRefresh)}</span>
    {/if}
    <button
      onclick={refreshHealth}
      disabled={refreshing}
      class="cursor-pointer rounded-lg border border-edge bg-surface px-3.5 py-2 text-sm font-medium text-slate-300 transition-all duration-150 enabled:hover:bg-surface-raised enabled:hover:text-fg disabled:cursor-not-allowed disabled:opacity-50">
      {refreshing ? "…" : "↺ Rafraîchir"}
    </button>
  </div>
</header>

{#if loadError}
  <AlertBanner message={loadError} />
{/if}

{#if !health && !loadError}
  <LoadingSpinner />
{/if}

{#if health}
  <!-- ── État ── -->
  <div class="mb-2.5 text-2xs font-semibold tracking-wider text-fg-faint uppercase">État</div>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
    <StatCard title="Serveur" dot="green">
      <dl class="m-0 flex flex-col gap-2">
        <Field label="Uptime" strong>{formatUptime(health.uptime_seconds)}</Field>
        <Field label="Python">{health.python_version}</Field>
      </dl>
    </StatCard>

    <StatCard title="Whisper" dot={health.whisper.loaded ? "green" : "amber"}>
      <dl class="m-0 flex flex-col gap-2">
        <Field label="Modèle" strong>{health.whisper.model}</Field>
        <Field label="Device">{health.whisper.device}</Field>
        <Field label="Chargé">
          <StatusBadge color={health.whisper.loaded ? "green" : "amber"} label={health.whisper.loaded ? "Oui" : "Non"} />
        </Field>
      </dl>
    </StatCard>

    <StatCard title="API Anthropic" dot={health.anthropic.api_key_set ? "green" : "red"}>
      <dl class="m-0 flex flex-col gap-2">
        <Field label="Clé API">
          {#if health.anthropic.api_key_set}
            <StatusBadge color="green" label="Configurée" />
            <span class="font-mono text-xs text-fg-faint">{health.anthropic.api_key_hint}</span>
          {:else}
            <StatusBadge color="red" label="Manquante" />
          {/if}
        </Field>
      </dl>
    </StatCard>

    {#if health.memory}
      <StatCard title="Mémoire (processus)" dot="green">
        <dl class="m-0 flex flex-col gap-2">
          <Field label="RSS" strong>{health.memory.rss_mb} Mo</Field>
          <Field label="VMS">{health.memory.vms_mb} Mo</Field>
        </dl>
      </StatCard>
    {/if}
  </div>
{/if}

{#if config}
  <!-- ── Paramètres éditables ── -->
  <div class="mt-7 mb-2.5 text-2xs font-semibold tracking-wider text-fg-faint uppercase">
    Paramètres
  </div>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-3.5">
    <StatCard title="Éditables">
      <div class="mb-3.5 flex flex-col gap-1">
        <label for="model" class="text-xs font-medium text-fg-muted">Modèle Anthropic</label>
        <select
          id="model"
          bind:value={draftModel}
          class="cursor-pointer appearance-auto rounded-lg border border-edge-hi bg-[#0e0e1c] px-3 py-2 text-sm text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none">
          {#each config.options.models as m}
            <option value={m}>{m}</option>
          {/each}
        </select>
        <span class="text-2xs text-fg-faint">Appliqué immédiatement au prochain appel fact-check.</span>
      </div>

      <div class="mb-3.5 flex flex-col gap-1">
        <label for="loglevel" class="text-xs font-medium text-fg-muted">Niveau de log</label>
        <select
          id="loglevel"
          bind:value={draftLevel}
          class="cursor-pointer appearance-auto rounded-lg border border-edge-hi bg-[#0e0e1c] px-3 py-2 text-sm text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none">
          {#each config.options.log_levels as l}
            <option value={l}>{l}</option>
          {/each}
        </select>
        <span class="text-2xs text-fg-faint"
          >Modifie <code class="font-mono text-accent-light">logging.getLogger("app")</code> en temps réel.</span>
      </div>

      {#if saveError}
        <AlertBanner message={saveError} />
      {/if}

      <div class="mt-4 flex justify-end gap-2">
        <button
          class="cursor-pointer rounded-lg border border-edge bg-surface px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-150 enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
          onclick={reset}
          disabled={!dirty || saving}>Annuler</button>
        <button
          class="cursor-pointer rounded-lg bg-[linear-gradient(135deg,#5a5ad0,#7a4ad0)] px-4 py-2 text-sm font-semibold text-white transition-all duration-150 enabled:hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          onclick={save}
          disabled={!dirty || saving}>
          {#if saving}Enregistrement…{:else if saved}✓ Enregistré{:else}Enregistrer{/if}
        </button>
      </div>

      <p
        class="mt-3.5 mb-0 rounded-md border border-amber-500/18 bg-amber-500/7 px-3 py-2 text-xs text-amber-700/80">
        ⚠ {config.note}
      </p>
    </StatCard>

    <StatCard title="Lecture seule">
      <dl class="m-0 flex flex-col gap-2">
        <Field label="Modèle Whisper">{config.readonly.whisper_model}</Field>
        <Field label="Device Whisper">{config.readonly.whisper_device}</Field>
        <Field label="JWT expire">{config.readonly.jwt_expire_hours} h</Field>
        <Field label="Max claims / chunk">
          {config.readonly.max_claims_per_chunk}
          <StatusBadge color="gray" label="non utilisé" />
        </Field>
      </dl>
    </StatCard>
  </div>
{/if}
