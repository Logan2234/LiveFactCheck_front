<script lang="ts">
  import Button from "$lib/components/Button.svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";
  import { onDestroy, onMount } from "svelte";
  import Alert from "$lib/components/Alert.svelte";
  import Field from "$lib/components/Field.svelte";
  import LoadingSpinner from "$lib/components/LoadingSpinner.svelte";
  import StatCard from "$lib/components/StatCard.svelte";
  import StatusBadge from "$lib/components/StatusBadge.svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";
  import { onDestroy, onMount } from "svelte";

  // Mirror of the backend descriptor contract (app/schemas/admin.py). Any change to
  // ConfigFieldValue / ConfigBlockOut / AdminHealthResponse is a two-repo change.
  type FieldKind = "readonly" | "editable" | "secret_status";
  type ValueType = "str" | "int" | "bool" | "list";

  interface ConfigFieldValue {
    key: string;
    label: string;
    kind: FieldKind;
    value: unknown;
    configured: boolean | null;
    options: string[] | null;
    value_type: ValueType | null;
  }

  interface ConfigBlock {
    id: string;
    title: string;
    fields: ConfigFieldValue[];
  }

  interface ConfigData {
    blocks: ConfigBlock[];
    note: string;
  }

  interface HealthData {
    uptime_seconds: number;
    python_version: string;
    whisper_loaded: boolean;
    memory?: { rss_mb: number; vms_mb: number };
  }

  type DraftValue = string | number | boolean;

  let health = $state<HealthData | null>(null);
  let config = $state<ConfigData | null>(null);
  let loadError = $state("");
  let refreshing = $state(false);
  let lastRefresh = $state<Date | null>(null);

  let saving = $state(false);
  let saved = $state(false);
  let saveError = $state("");
  // Draft values for editable fields, keyed by their Settings key.
  let drafts = $state<Record<string, DraftValue>>({});

  let dirty = $derived.by(() => {
    if (!config) return false;
    for (const block of config.blocks) {
      for (const f of block.fields) {
        if (f.kind === "editable" && drafts[f.key] !== f.value) return true;
      }
    }
    return false;
  });

  let interval: ReturnType<typeof setInterval>;

  const controlClass =
    "rounded-lg border border-edge-hi bg-[#0e0e1c] px-3 py-2 text-sm text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none";
  const selectClass = `cursor-pointer appearance-auto ${controlClass}`;

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

  function formatValue(f: ConfigFieldValue): string {
    if (Array.isArray(f.value)) return f.value.length ? f.value.join(", ") : "—";
    if (f.value_type === "bool") return f.value ? "Oui" : "Non";
    return String(f.value);
  }

  // Green/red for blocks carrying secrets, green/amber for Whisper (runtime loaded state).
  function blockDot(block: ConfigBlock): "green" | "amber" | "red" | "none" {
    if (block.id === "whisper") return health?.whisper_loaded ? "green" : "amber";
    const secrets = block.fields.filter((f) => f.kind === "secret_status");
    if (secrets.length === 0) return "none";
    return secrets.every((f) => f.configured) ? "green" : "red";
  }

  function initDrafts(cfg: ConfigData) {
    const next: Record<string, DraftValue> = {};
    for (const block of cfg.blocks) {
      for (const f of block.fields) {
        if (f.kind === "editable") next[f.key] = f.value as DraftValue;
      }
    }
    drafts = next;
  }

  function setDraft(key: string, value: DraftValue) {
    drafts[key] = value;
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
      if (config) initDrafts(config);
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
      const updates: Record<string, DraftValue> = {};
      for (const block of config.blocks) {
        for (const f of block.fields) {
          if (f.kind === "editable" && drafts[f.key] !== f.value) updates[f.key] = drafts[f.key];
        }
      }

      const res = await authFetch("/admin/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates })
      });
      if (res.status === 401) {
        clearToken();
        return;
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Erreur ${res.status}`);
      }
      const data: { changed: Record<string, unknown> } = await res.json();
      // Reflect the server-accepted (coerced) values back into config + drafts.
      for (const block of config.blocks) {
        for (const f of block.fields) {
          if (f.key in data.changed) {
            f.value = data.changed[f.key];
            drafts[f.key] = data.changed[f.key] as DraftValue;
          }
        }
      }
      saved = true;
      setTimeout(() => (saved = false), 2000);
    } catch (e) {
      saveError = e instanceof Error ? e.message : "Erreur réseau";
    } finally {
      saving = false;
    }
  }

  function reset() {
    if (config) initDrafts(config);
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
    <Button variant="secondary" size="sm" onclick={refreshHealth} disabled={refreshing}>
      {refreshing ? "…" : "↺ Rafraîchir"}
    </Button>
  </div>
</header>

{#if loadError}
  <Alert type="error" message={loadError} />
{/if}

{#if !health && !loadError}
  <LoadingSpinner />
{/if}

{#if health}
  <!-- ── Runtime (issu de /admin/health) ── -->
  <div class="mb-2.5 text-2xs font-semibold tracking-wider text-fg-faint uppercase">État</div>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
    <StatCard title="Serveur" dot="green">
      <dl class="m-0 flex flex-col gap-2">
        <Field label="Uptime" strong>{formatUptime(health.uptime_seconds)}</Field>
        <Field label="Python">{health.python_version}</Field>
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
  <!-- ── Configuration (pilotée par le descripteur back) ── -->
  <div class="mt-7 mb-2.5 text-2xs font-semibold tracking-wider text-fg-faint uppercase">
    Configuration
  </div>

  <div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-start gap-3.5">
    {#each config.blocks as block (block.id)}
      <StatCard title={block.title} dot={blockDot(block)}>
        <div class="flex flex-col gap-3">
          {#each block.fields as f (f.key)}
            {#if f.kind === "editable"}
              <div class="flex flex-col gap-1">
                <label for={f.key} class="text-xs font-medium text-fg-muted">{f.label}</label>
                {#if f.options}
                  <select
                    id={f.key}
                    value={drafts[f.key] as string}
                    onchange={(e) => setDraft(f.key, e.currentTarget.value)}
                    class={selectClass}>
                    {#each f.options as opt}
                      <option value={opt}>{opt}</option>
                    {/each}
                  </select>
                {:else if f.value_type === "bool"}
                  <label
                    class="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={drafts[f.key] as boolean}
                      onchange={(e) => setDraft(f.key, e.currentTarget.checked)} />
                    {drafts[f.key] ? "Activé" : "Désactivé"}
                  </label>
                {:else if f.value_type === "int"}
                  <input
                    id={f.key}
                    type="number"
                    value={drafts[f.key] as number}
                    oninput={(e) => setDraft(f.key, e.currentTarget.valueAsNumber)}
                    class={controlClass} />
                {:else}
                  <input
                    id={f.key}
                    type="text"
                    value={drafts[f.key] as string}
                    oninput={(e) => setDraft(f.key, e.currentTarget.value)}
                    class={controlClass} />
                {/if}
              </div>
            {:else}
              <Field label={f.label}>
                {#if f.kind === "secret_status"}
                  {#if f.configured}
                    <StatusBadge color="green" label="Configuré" />
                  {:else}
                    <StatusBadge color="red" label="Manquant" />
                  {/if}
                {:else}
                  {formatValue(f)}
                {/if}
              </Field>
            {/if}
          {/each}

          {#if block.id === "whisper"}
            <Field label="Chargé">
              <StatusBadge
                color={health?.whisper_loaded ? "green" : "amber"}
                label={health?.whisper_loaded ? "Oui" : "Non"} />
            </Field>
          {/if}
        </div>
      </StatCard>
    {/each}
  </div>

  <!-- ── Barre d'action (les éditions peuvent couvrir plusieurs blocs) ── -->
  {#if saveError}
    <div class="mt-4"><AlertBanner message={saveError} /></div>
  {/if}

  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <p
      class="m-0 rounded-md border border-amber-500/18 bg-amber-500/7 px-3 py-2 text-xs text-amber-700/80">
      ⚠ {config.note}
    </p>
    <div class="flex gap-2">
      <Button variant="secondary" onclick={reset} disabled={!dirty || saving}>Annuler</Button>
      <Button onclick={save} disabled={!dirty || saving}>
        {#if saving}Enregistrement…{:else if saved}✓ Enregistré{:else}Enregistrer{/if}
      </Button>
    </div>
  </div>
{/if}
