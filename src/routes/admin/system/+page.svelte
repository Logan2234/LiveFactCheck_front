<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";

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

<header>
  <div>
    <h1>🖥️ Système</h1>
    <p>État du serveur et configuration — rafraîchissement automatique toutes les 30 s.</p>
  </div>
  <div class="header-right">
    {#if lastRefresh}
      <span class="last-refresh">Mis à jour à {formatTime(lastRefresh)}</span>
    {/if}
    <button onclick={refreshHealth} disabled={refreshing} class="refresh-btn">
      {refreshing ? "…" : "↺ Rafraîchir"}
    </button>
  </div>
</header>

{#if loadError}
  <p class="error" role="alert">{loadError}</p>
{/if}

{#if !health && !loadError}
  <div class="loading"><span class="spinner"></span> Chargement…</div>
{/if}

{#if health}
  <!-- ── État ── -->
  <div class="section-label">État</div>
  <div class="grid">
    <!-- Serveur -->
    <div class="card">
      <div class="card-title">
        <span class="dot dot-ok"></span>Serveur
      </div>
      <dl>
        <div class="row">
          <dt>Uptime</dt>
          <dd class="highlight">{formatUptime(health.uptime_seconds)}</dd>
        </div>
        <div class="row">
          <dt>Python</dt>
          <dd>{health.python_version}</dd>
        </div>
      </dl>
    </div>

    <!-- Whisper -->
    <div class="card">
      <div class="card-title">
        <span class="dot {health.whisper.loaded ? 'dot-ok' : 'dot-warn'}"></span>Whisper
      </div>
      <dl>
        <div class="row">
          <dt>Modèle</dt>
          <dd class="highlight">{health.whisper.model}</dd>
        </div>
        <div class="row">
          <dt>Device</dt>
          <dd>{health.whisper.device}</dd>
        </div>
        <div class="row">
          <dt>Chargé</dt>
          <dd>
            {#if health.whisper.loaded}
              <span class="badge badge-ok">Oui</span>
            {:else}
              <span class="badge badge-warn">Non</span>
            {/if}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Anthropic -->
    <div class="card">
      <div class="card-title">
        <span class="dot {health.anthropic.api_key_set ? 'dot-ok' : 'dot-err'}"></span>API Anthropic
      </div>
      <dl>
        <div class="row">
          <dt>Clé API</dt>
          <dd>
            {#if health.anthropic.api_key_set}
              <span class="badge badge-ok">Configurée</span>
              <span class="key-hint">{health.anthropic.api_key_hint}</span>
            {:else}
              <span class="badge badge-err">Manquante</span>
            {/if}
          </dd>
        </div>
      </dl>
    </div>

    <!-- Mémoire -->
    {#if health.memory}
      <div class="card">
        <div class="card-title">
          <span class="dot dot-ok"></span>Mémoire (processus)
        </div>
        <dl>
          <div class="row">
            <dt>RSS</dt>
            <dd class="highlight">{health.memory.rss_mb} Mo</dd>
          </div>
          <div class="row">
            <dt>VMS</dt>
            <dd>{health.memory.vms_mb} Mo</dd>
          </div>
        </dl>
      </div>
    {/if}
  </div>
{/if}

{#if config}
  <!-- ── Paramètres éditables ── -->
  <div class="section-label" style="margin-top:1.75rem">Paramètres</div>
  <div class="settings-grid">
    <div class="card settings-card">
      <div class="card-title">Éditables</div>

      <div class="field">
        <label for="model">Modèle Anthropic</label>
        <select id="model" bind:value={draftModel}>
          {#each config.options.models as m}
            <option value={m}>{m}</option>
          {/each}
        </select>
        <span class="field-hint">Appliqué immédiatement au prochain appel fact-check.</span>
      </div>

      <div class="field">
        <label for="loglevel">Niveau de log</label>
        <select id="loglevel" bind:value={draftLevel}>
          {#each config.options.log_levels as l}
            <option value={l}>{l}</option>
          {/each}
        </select>
        <span class="field-hint">Modifie <code>logging.getLogger("app")</code> en temps réel.</span>
      </div>

      {#if saveError}
        <p class="error small" role="alert">{saveError}</p>
      {/if}

      <div class="actions">
        <button class="ghost" onclick={reset} disabled={!dirty || saving}>Annuler</button>
        <button class="primary" onclick={save} disabled={!dirty || saving}>
          {#if saving}Enregistrement…{:else if saved}✓ Enregistré{:else}Enregistrer{/if}
        </button>
      </div>

      <p class="note">⚠ {config.note}</p>
    </div>

    <div class="card settings-card">
      <div class="card-title">Lecture seule</div>
      <dl>
        <div class="row">
          <dt>Modèle Whisper</dt>
          <dd>{config.readonly.whisper_model}</dd>
        </div>
        <div class="row">
          <dt>Device Whisper</dt>
          <dd>{config.readonly.whisper_device}</dd>
        </div>
        <div class="row">
          <dt>JWT expire</dt>
          <dd>{config.readonly.jwt_expire_hours} h</dd>
        </div>
        <div class="row">
          <dt>Max claims / chunk</dt>
          <dd>
            {config.readonly.max_claims_per_chunk}
            <span class="badge-inactive">non utilisé</span>
          </dd>
        </div>
      </dl>
    </div>
  </div>
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

  header h1 {
    font-size: 1.4rem;
    margin: 0 0 0.3rem;
  }
  header p {
    color: #8888a0;
    font-size: 0.88rem;
    margin: 0;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-shrink: 0;
  }

  .last-refresh {
    font-size: 0.78rem;
    color: #6a6a88;
    font-variant-numeric: tabular-nums;
  }

  .refresh-btn {
    background: #1e1e30;
    border: 1px solid #2e2e3e;
    color: #b0b0c8;
    border-radius: 8px;
    padding: 0.5rem 0.9rem;
    font-size: 0.82rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.15s;
  }

  .refresh-btn:hover:not(:disabled) {
    background: #26263a;
    color: #e0e0f0;
  }
  .refresh-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .loading {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    color: #8888a0;
    font-size: 0.9rem;
  }

  .spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid #3a3a5a;
    border-top-color: #7a7ad0;
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
    flex-shrink: 0;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #fca5a5;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  .error.small {
    padding: 0.45rem 0.7rem;
    font-size: 0.8rem;
    margin: 0.5rem 0 0;
  }

  .section-label {
    font-size: 0.72rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    color: #4a4a68;
    margin-bottom: 0.6rem;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 0.85rem;
  }

  .settings-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 0.85rem;
    align-items: start;
  }

  .card {
    background: #161624;
    border: 1px solid #2e2e3e;
    border-radius: 12px;
    padding: 1rem 1.1rem;
  }

  .settings-card {
    padding: 1.1rem 1.2rem;
  }

  .card-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    font-weight: 600;
    color: #c8c8e8;
    margin-bottom: 0.85rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid #26263a;
  }

  .dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .dot-ok {
    background: #22c55e;
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  }
  .dot-warn {
    background: #f59e0b;
    box-shadow: 0 0 6px rgba(245, 158, 11, 0.5);
  }
  .dot-err {
    background: #ef4444;
    box-shadow: 0 0 6px rgba(239, 68, 68, 0.5);
  }

  dl {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 0.45rem;
  }

  .row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
    min-width: 0;
  }

  dt {
    font-size: 0.78rem;
    color: #7a7a98;
    flex-shrink: 0;
  }

  dd {
    font-size: 0.8rem;
    color: #b0b0c8;
    margin: 0;
    text-align: right;
    display: flex;
    align-items: center;
    gap: 0.35rem;
    flex-wrap: wrap;
    justify-content: flex-end;
  }

  .highlight {
    color: #e0e0f8;
    font-weight: 600;
  }

  .badge {
    border-radius: 999px;
    padding: 0.13rem 0.5rem;
    font-size: 0.72rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .badge-ok {
    background: rgba(34, 197, 94, 0.12);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
  .badge-warn {
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.25);
  }
  .badge-err {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }

  .key-hint {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.73rem;
    color: #6a6a88;
  }

  .badge-inactive {
    font-size: 0.68rem;
    color: #5a5a78;
    background: rgba(100, 100, 140, 0.12);
    border: 1px solid rgba(100, 100, 140, 0.2);
    border-radius: 999px;
    padding: 0.08rem 0.4rem;
  }

  /* Settings */
  .field {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    margin-bottom: 0.9rem;
  }

  label {
    font-size: 0.78rem;
    color: #9a9ab8;
    font-weight: 500;
  }

  select {
    background: #0e0e1c;
    border: 1px solid #3a3a5a;
    border-radius: 8px;
    color: #e0e0f0;
    font-size: 0.86rem;
    padding: 0.45rem 0.7rem;
    cursor: pointer;
    transition: border-color 0.15s;
    appearance: auto;
  }

  select:focus {
    outline: none;
    border-color: #6a6acc;
  }

  .field-hint {
    font-size: 0.72rem;
    color: #5a5a78;
  }
  .field-hint code {
    font-family: "SF Mono", "Fira Code", monospace;
    color: #7a7aaa;
  }

  .actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1rem;
  }

  button {
    border-radius: 8px;
    padding: 0.48rem 0.95rem;
    font-size: 0.83rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .primary {
    background: linear-gradient(135deg, #5a5ad0, #7a4ad0);
    color: #fff;
    border: none;
  }
  .primary:hover:not(:disabled) {
    opacity: 0.88;
  }

  .ghost {
    background: #1e1e30;
    color: #b0b0c8;
    border: 1px solid #2e2e3e;
  }
  .ghost:hover:not(:disabled) {
    background: #26263a;
  }

  .note {
    margin: 0.85rem 0 0;
    font-size: 0.75rem;
    color: #7a6a3a;
    background: rgba(245, 158, 11, 0.07);
    border: 1px solid rgba(245, 158, 11, 0.18);
    border-radius: 6px;
    padding: 0.45rem 0.7rem;
  }
</style>
