<script lang="ts">
  import { AdminAuthError, adminJson } from "$lib/admin";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import Field from "$lib/components/ui/Field.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import StatCard from "$lib/components/ui/StatCard.svelte";
  import StatusBadge from "$lib/components/ui/StatusBadge.svelte";
  import { formatTime, formatUptime } from "$lib/utils/format";
  import { onDestroy, onMount } from "svelte";

  // Mirror of the backend descriptor contract (app/schemas/admin.py). Any change to
  // ConfigFieldValue / ConfigBlockOut / AdminHealthResponse is a two-repo change.
  type FieldKind = "readonly" | "editable" | "secret_status";
  type ValueType = "str" | "int" | "float" | "bool" | "list";

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

  // Frontend build version, injected by Vite's define (see vite.config.ts).
  const appVersion = __APP_VERSION__;

  let interval: ReturnType<typeof setInterval>;

  const controlClass =
    "rounded-lg border border-edge-hi bg-surface-term px-3 py-2 text-sm text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none";
  const selectClass = `cursor-pointer appearance-auto ${controlClass}`;

  function formatValue(f: ConfigFieldValue): string {
    if (Array.isArray(f.value))
      return f.value.length ? f.value.join(", ") : "—";
    if (f.value_type === "bool") return f.value ? "Oui" : "Non";
    return String(f.value);
  }

  // Per-block visual identity (masonry cards): a leading glyph + a coloured left accent.
  // Unknown ids fall back to a neutral accent so a new backend block still renders cleanly.
  const blockIcon: Record<string, string> = {
    anthropic: "🔑",
    whisper: "🎙️",
    audio: "🔊",
    vad: "✂️",
    auth: "🔒",
    cors: "🌐",
    logs: "📋"
  };

  const blockAccent: Record<string, string> = {
    anthropic: "border-l-2 border-l-violet-500/60",
    whisper: "border-l-2 border-l-cyan-500/60",
    audio: "border-l-2 border-l-sky-500/60",
    vad: "border-l-2 border-l-fuchsia-500/60",
    auth: "border-l-2 border-l-amber-500/60",
    cors: "border-l-2 border-l-emerald-500/60",
    logs: "border-l-2 border-l-slate-500/60"
  };

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
      health = await adminJson<HealthData>("/admin/health");
      lastRefresh = new Date();
      loadError = "";
    } catch (e) {
      if (e instanceof AdminAuthError) return;
      loadError = e instanceof Error ? e.message : "Erreur réseau";
    } finally {
      refreshing = false;
    }
  }

  async function loadAll() {
    loadError = "";
    try {
      [health, config] = await Promise.all([
        adminJson<HealthData>("/admin/health"),
        adminJson<ConfigData>("/admin/config")
      ]);
      if (config) initDrafts(config);
      lastRefresh = new Date();
    } catch (e) {
      if (e instanceof AdminAuthError) return;
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
          if (f.kind === "editable" && drafts[f.key] !== f.value)
            updates[f.key] = drafts[f.key];
        }
      }

      const data = await adminJson<{ changed: Record<string, unknown> }>(
        "/admin/config",
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ updates })
        }
      );
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
      if (e instanceof AdminAuthError) return;
      saveError = e instanceof Error ? e.message : "Erreur réseau";
    } finally {
      saving = false;
    }
  }

  function reset() {
    if (config) initDrafts(config);
  }

  onMount(() => {
    void loadAll();
    interval = setInterval(() => void refreshHealth(), 30_000);
  });

  onDestroy(() => clearInterval(interval));
</script>

<svelte:head>
  <title>Système — Admin</title>
</svelte:head>

<PageHeader
  title="Système"
  subtitle="État du serveur et configuration — rafraîchissement automatique toutes les 30 s.">
  {#snippet actions()}
    {#if lastRefresh}
      <span class="text-xs tabular-nums text-fg-faint"
        >Mis à jour à {formatTime(lastRefresh)}</span>
    {/if}
    <Button
      variant="secondary"
      size="sm"
      onclick={refreshHealth}
      disabled={refreshing}>
      {refreshing ? "…" : "↺ Rafraîchir"}
    </Button>
  {/snippet}
</PageHeader>

{#if loadError}
  <Alert type="error" message={loadError} />
{/if}

{#if !health && !loadError}
  <LoadingSpinner />
{/if}

{#if health}
  <div
    class="mb-2.5 text-2xs font-semibold tracking-wider text-fg-faint uppercase">
    État
  </div>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3.5">
    <StatCard title="Serveur" dot="green">
      <dl class="m-0 flex flex-col gap-2">
        <Field label="Uptime" strong
          >{formatUptime(health.uptime_seconds)}</Field>
        <Field label="Python">{health.python_version}</Field>
        <Field label="Frontend">v{appVersion}</Field>
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
  <div
    class="mt-7 mb-2.5 text-2xs font-semibold tracking-wider text-fg-faint uppercase">
    Configuration
  </div>

  <!-- Masonry (CSS columns): cards keep their natural height, no patchwork of gaps. -->
  <div class="columns-1 gap-x-3.5 sm:columns-2 lg:columns-3">
    {#each config.blocks as block (block.id)}
      <div class="mb-3.5 break-inside-avoid">
        <StatCard
          title={block.title}
          icon={blockIcon[block.id] ?? ""}
          accent={blockAccent[block.id] ?? ""}>
          <div class="flex flex-col gap-3">
            {#each block.fields as f (f.key)}
              {#if f.kind === "editable"}
                <div class="flex flex-col gap-1">
                  <label for={f.key} class="text-xs font-medium text-fg-muted"
                    >{f.label}</label>
                  {#if f.options}
                    <select
                      id={f.key}
                      value={drafts[f.key] as string}
                      onchange={(e) => setDraft(f.key, e.currentTarget.value)}
                      class={selectClass}>
                      {#each f.options as opt (opt)}
                        <option value={opt}>{opt}</option>
                      {/each}
                    </select>
                  {:else if f.value_type === "bool"}
                    <label
                      class="inline-flex cursor-pointer items-center gap-2 text-sm text-fg-muted">
                      <input
                        type="checkbox"
                        checked={drafts[f.key] as boolean}
                        onchange={(e) =>
                          setDraft(f.key, e.currentTarget.checked)} />
                      {drafts[f.key] ? "Activé" : "Désactivé"}
                    </label>
                  {:else if f.value_type === "int" || f.value_type === "float"}
                    <input
                      id={f.key}
                      type="number"
                      step={f.value_type === "float" ? "any" : undefined}
                      value={drafts[f.key] as number}
                      oninput={(e) =>
                        setDraft(f.key, e.currentTarget.valueAsNumber)}
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
                  {:else if f.value_type === "bool"}
                    <StatusBadge
                      color={f.value ? "green" : "red"}
                      label={f.value ? "Oui" : "Non"} />
                  {:else}
                    {formatValue(f)}
                  {/if}
                </Field>
              {/if}
            {/each}

            {#if block.id === "whisper"}
              <Field label="Chargé">
                <StatusBadge
                  color={health?.whisper_loaded ? "green" : "red"}
                  label={health?.whisper_loaded ? "Oui" : "Non"} />
              </Field>
            {/if}
          </div>
        </StatCard>
      </div>
    {/each}
  </div>

  <!-- ── Barre d'action (les éditions peuvent couvrir plusieurs blocs) ── -->
  {#if saveError}
    <Alert message={saveError} type="error" class="mt-4" />
  {/if}

  <div class="mt-4 flex flex-wrap items-center justify-between gap-3">
    <Alert type="warning" message={`⚠  ${config.note}`} />
    <div class="flex gap-2">
      <Button variant="secondary" onclick={reset} disabled={!dirty || saving}
        >Annuler</Button>
      <Button onclick={save} disabled={!dirty || saving}>
        {#if saving}Enregistrement…{:else if saved}✓ Enregistré{:else}Enregistrer{/if}
      </Button>
    </div>
  </div>
{/if}
