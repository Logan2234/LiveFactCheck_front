<script lang="ts">
  import { resolve } from "$app/paths";
  import AccountChyron from "$lib/components/features/account/AccountChyron.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { STATUS_META } from "$lib/constants/status";
  import type { VerificationStatus } from "$lib/stores/claims";
  import {
    defaultTriggerStatuses,
    TRIGGER_STATUSES
  } from "$lib/stores/notificationPrefs";
  import {
    createWebhook,
    deleteWebhook,
    listWebhooks,
    WEBHOOK_KINDS,
    type Webhook,
    type WebhookKind
  } from "$lib/webhooks";
  import { onMount } from "svelte";
  import { get } from "svelte/store";

  const inputClass =
    "border border-edge rounded-lg bg-surface px-3.5 py-2.5 text-sm text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none";

  let webhooks = $state<Webhook[]>([]);
  let webhooksError = $state("");
  let loadingWebhooks = $state(false);
  let revealed = $state<Record<string, boolean>>({});

  // create form — verdicts pre-selected from the user's saved default.
  let newName = $state("");
  let newUrl = $state("");
  let newKind = $state<WebhookKind>("slack");
  let newStatuses = $state<VerificationStatus[]>([
    ...get(defaultTriggerStatuses)
  ]);
  let creating = $state(false);
  let createError = $state("");

  let canCreate = $derived(
    newName.trim().length > 0 &&
      newUrl.trim().length > 0 &&
      newStatuses.length > 0
  );

  function toggleStatus(s: VerificationStatus) {
    newStatuses = newStatuses.includes(s)
      ? newStatuses.filter((x) => x !== s)
      : [...newStatuses, s];
  }

  async function loadWebhooks() {
    loadingWebhooks = true;
    webhooksError = "";
    try {
      webhooks = await listWebhooks();
    } catch (err) {
      webhooksError = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      loadingWebhooks = false;
    }
  }

  async function submitCreate(e: Event) {
    e.preventDefault();
    if (creating || !canCreate) return;
    creating = true;
    createError = "";
    try {
      const created = await createWebhook({
        name: newName.trim(),
        url: newUrl.trim(),
        kind: newKind,
        trigger_statuses: newStatuses
      });
      webhooks = [...webhooks, created];
      revealed[created.id] = true; // show the new secret so it can be copied
      newName = "";
      newUrl = "";
      newKind = "slack";
      newStatuses = [...get(defaultTriggerStatuses)];
    } catch (err) {
      createError = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      creating = false;
    }
  }

  async function remove(id: string) {
    try {
      await deleteWebhook(id);
      webhooks = webhooks.filter((w) => w.id !== id);
    } catch (err) {
      webhooksError = err instanceof Error ? err.message : "Erreur inconnue";
    }
  }

  function copy(text: string) {
    navigator.clipboard?.writeText(text);
  }

  function kindLabel(k: WebhookKind): string {
    return WEBHOOK_KINDS.find((x) => x.value === k)?.label ?? k;
  }

  function formatDate(iso: string | null): string {
    if (!iso) return "Jamais déclenchée";
    return new Date(iso).toLocaleString("fr-FR");
  }

  onMount(loadWebhooks);
</script>

<AccountChyron title="Alertes">
  {#snippet subtitle()}
    Recevez une requête HTTP sur votre endpoint dès qu'un fait du type choisi
    apparaît dans votre session. Chaque requête est signée (en-tête
    <code class="bg-surface-raised rounded px-1 py-0.5 text-xs"
      >X-LFC-Signature</code
    >) avec le secret de l'alerte.
  {/snippet}
</AccountChyron>

<!-- create -->
<form
  class="border-edge bg-surface-alt mb-8 flex flex-col gap-4 rounded-xl border p-5"
  onsubmit={submitCreate}>
  <h2 class="m-0 text-sm font-semibold">Nouvelle alerte</h2>

  <div class="grid gap-4 sm:grid-cols-2">
    <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
      <span>Nom</span>
      <input
        bind:value={newName}
        placeholder="Mon Slack"
        maxlength="100"
        class={inputClass} />
    </label>
    <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
      <span>URL de l'endpoint</span>
      <input
        bind:value={newUrl}
        type="url"
        placeholder="https://…"
        class={inputClass} />
    </label>
  </div>

  <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
    <span>Type de destination</span>
    <select bind:value={newKind} class={inputClass}>
      {#each WEBHOOK_KINDS as k (k.value)}
        <option value={k.value}>{k.label}</option>
      {/each}
    </select>
  </label>

  <div class="flex flex-col gap-2">
    <span class="text-fg-muted text-sm">Me prévenir quand un fait est</span>
    <div class="flex flex-wrap gap-2">
      {#each TRIGGER_STATUSES as status (status)}
        {@const active = newStatuses.includes(status)}
        <button
          type="button"
          aria-pressed={active}
          onclick={() => toggleStatus(status)}
          class="flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors"
          style={active
            ? `border-color: ${STATUS_META[status].color}66; background: ${STATUS_META[status].color}1f; color: ${STATUS_META[status].color};`
            : ""}
          class:border-edge={!active}
          class:text-fg-muted={!active}
          class:hover:text-fg={!active}>
          <span aria-hidden="true">{STATUS_META[status].icon}</span>
          <span>{STATUS_META[status].label}</span>
        </button>
      {/each}
    </div>
  </div>

  {#if createError}
    <p
      class="m-0 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2.5 text-sm text-red-300"
      role="alert">
      {createError}
    </p>
  {/if}

  <div>
    <Button type="submit" disabled={creating || !canCreate}>
      {creating ? "Ajout…" : "Ajouter l'alerte"}
    </Button>
  </div>
</form>

<!-- list -->
{#if webhooksError}
  <p
    class="mb-4 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2.5 text-sm text-red-300"
    role="alert">
    {webhooksError}
  </p>
{/if}

{#if loadingWebhooks}
  <p class="text-fg-faint text-sm">Chargement…</p>
{:else if webhooks.length === 0}
  <div
    class="border-edge text-fg-muted rounded-xl border border-dashed p-8 text-center text-sm">
    Aucune alerte configurée. Ajoutez l'URL d'un endpoint ci-dessus pour être
    prévenu en direct.
  </div>
{:else}
  <ul class="m-0 flex list-none flex-col gap-3 p-0">
    {#each webhooks as wh (wh.id)}
      <li class="border-edge bg-surface-alt rounded-xl border p-4">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="m-0 font-semibold">{wh.name}</p>
              <span
                class="border-edge text-fg-faint text-2xs rounded-full border px-2 py-0.5">
                {kindLabel(wh.kind)}
              </span>
            </div>
            <p class="text-fg-faint m-0 mt-0.5 truncate font-mono text-xs">
              {wh.url}
            </p>
          </div>
          <Button variant="danger" size="xs" onclick={() => remove(wh.id)}>
            Supprimer
          </Button>
        </div>

        <div class="mt-3 flex flex-wrap gap-1.5">
          {#each wh.trigger_statuses as status (status)}
            <span
              class="text-2xs rounded-full border px-2 py-0.5 font-medium"
              style="border-color: {STATUS_META[status]
                .color}40; background: {STATUS_META[status]
                .color}14; color: {STATUS_META[status].color};">
              {STATUS_META[status].icon}
              {STATUS_META[status].label}
            </span>
          {/each}
        </div>

        <!-- secret -->
        <div class="mt-3 flex items-center gap-2">
          <code
            class="bg-surface text-fg-muted min-w-0 flex-1 truncate rounded-lg px-3 py-2 font-mono text-xs">
            {revealed[wh.id] ? wh.secret : "•".repeat(24)}
          </code>
          <Button
            variant="secondary"
            size="xs"
            onclick={() => (revealed[wh.id] = !revealed[wh.id])}>
            {revealed[wh.id] ? "Masquer" : "Révéler"}
          </Button>
          <Button variant="secondary" size="xs" onclick={() => copy(wh.secret)}>
            Copier
          </Button>
        </div>

        <!-- delivery health -->
        <div class="text-fg-faint mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <span>Dernier envoi : {formatDate(wh.last_triggered_at)}</span>
          {#if wh.failure_count > 0}
            <span class="text-red-400">
              {wh.failure_count} échec{wh.failure_count > 1 ? "s" : ""}
              {#if wh.last_error}— {wh.last_error}{/if}
            </span>
          {/if}
        </div>
      </li>
    {/each}
  </ul>
{/if}

<p class="mt-8">
  <a
    href={resolve("/account/notifications")}
    class="text-fg-faint hover:text-fg-muted text-sm no-underline">
    Régler les statuts surveillés par défaut →
  </a>
</p>
