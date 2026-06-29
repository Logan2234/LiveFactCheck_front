<script lang="ts">
  import { AdminAuthError, adminJson } from "$lib/admin";
  import Alert from "$lib/components/ui/Alert.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import StatusBadge from "$lib/components/ui/StatusBadge.svelte";
  import { copyText } from "$lib/utils/clipboard";
  import { onMount } from "svelte";

  interface PromptData {
    system_prompt: string;
    claim_tool: unknown;
    web_search_tool: unknown;
    valid_statuses: string[];
    min_words: number;
    max_tokens: number;
    model: string;
  }

  type BadgeColor = "green" | "amber" | "red" | "gray";
  const STATUS_COLOR: Record<string, BadgeColor> = {
    verified: "green",
    false: "red",
    uncertain: "amber",
    unverifiable: "gray"
  };

  let data = $state<PromptData | null>(null);
  let error = $state("");
  let copied = $state<string | null>(null);

  async function load() {
    try {
      data = await adminJson<PromptData>("/admin/prompt");
    } catch (e) {
      if (e instanceof AdminAuthError) return;
      error = e instanceof Error ? e.message : "Erreur réseau";
    }
  }

  async function copyToClipboard(key: string, value: string) {
    if (await copyText(value)) {
      copied = key;
      setTimeout(() => (copied = null), 1800);
    }
  }

  onMount(load);
</script>

<svelte:head>
  <title>Prompt & Outil — Admin</title>
</svelte:head>

<PageHeader
  title="📋 Prompt & Outil Claude"
  subtitle="Configuration exacte envoyée à l'API Anthropic à chaque appel de fact-checking." />

{#if error}
  <Alert type="error" message={error} />
{:else if !data}
  <LoadingSpinner />
{:else}
  <div class="mb-4 flex flex-wrap gap-2 text-sm">
    <div
      class="rounded-lg border border-surface-selected bg-surface-alt px-3.5 py-2 text-fg-muted">
      Modèle : <strong class="text-fg">{data.model}</strong>
    </div>
    <div
      class="rounded-lg border border-surface-selected bg-surface-alt px-3.5 py-2 text-fg-muted">
      Min. <strong class="text-fg">{data.min_words}</strong> mots / analyse
    </div>
    <div
      class="rounded-lg border border-surface-selected bg-surface-alt px-3.5 py-2 text-fg-muted">
      Max. <strong class="text-fg">{data.max_tokens.toLocaleString()}</strong> tokens
      / appel
    </div>
  </div>

  <div
    class="mb-7 rounded-lg border border-surface bg-surface-term px-4 py-3 text-xs leading-relaxed text-fg-muted">
    <p
      class="m-0 mb-1.5 text-2xs font-semibold tracking-wider text-fg-faint uppercase">
      Stratégie d'appel
    </p>
    Sortie structurée imposée via l'outil
    <code class="font-mono text-accent-light">submit_claims</code>. En mode
    <strong class="text-fg">rapide</strong>, l'outil est forcé (<code
      class="font-mono">tool_choice</code
    >) → un seul appel, sans web. En mode
    <strong class="text-fg">approfondi</strong>,
    <code class="font-mono">web_search</code> est disponible et, si le modèle
    recherche sans structurer, un 2ᵉ appel force
    <code class="font-mono">submit_claims</code>.
  </div>

  {#snippet sectionHeader(key: string, label: string, json?: unknown)}
    <div class="mb-2.5 flex items-center justify-between">
      <!-- eslint-disable-next-line svelte/no-at-html-tags -- label is a hardcoded literal, never user input -->
      <h2 class="m-0 text-base text-fg">{@html label}</h2>
      <button
        class="cursor-pointer rounded-md border border-edge bg-surface px-3 py-1 text-xs text-fg-muted transition-all duration-150 hover:bg-surface-raised hover:text-fg"
        onclick={() =>
          copyToClipboard(
            key,
            json !== undefined
              ? JSON.stringify(json, null, 2)
              : data!.system_prompt
          )}>
        {copied === key
          ? "✓ Copié"
          : json !== undefined
            ? "Copier JSON"
            : "Copier"}
      </button>
    </div>
  {/snippet}

  <section class="mb-8">
    {@render sectionHeader("prompt", "Prompt système")}
    <pre
      class="m-0 max-h-100 overflow-x-auto overflow-y-auto rounded-xl border border-edge bg-surface-term px-5 py-4 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-fg">{data.system_prompt}</pre>
  </section>

  <section class="mb-8">
    {@render sectionHeader(
      "claim",
      'Outil <code class="font-mono text-sm text-accent-light">submit_claims</code>',
      data.claim_tool
    )}
    <div
      class="mb-2.5 flex flex-wrap items-center gap-1.5 text-sm text-fg-faint">
      Statuts valides :
      {#each data.valid_statuses as s (s)}
        <StatusBadge color={STATUS_COLOR[s] ?? "gray"} label={s} />
      {/each}
    </div>
    <pre
      class="m-0 max-h-100 overflow-x-auto overflow-y-auto rounded-xl border border-edge bg-surface-term px-5 py-4 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-fg">{JSON.stringify(
        data.claim_tool,
        null,
        2
      )}</pre>
  </section>

  <section class="mb-8">
    {@render sectionHeader(
      "ws",
      'Outil <code class="font-mono text-sm text-accent-light">web_search</code>',
      data.web_search_tool
    )}
    <pre
      class="m-0 max-h-100 overflow-x-auto overflow-y-auto rounded-xl border border-edge bg-surface-term px-5 py-4 font-mono text-xs leading-relaxed wrap-break-word whitespace-pre-wrap text-fg">{JSON.stringify(
        data.web_search_tool,
        null,
        2
      )}</pre>
  </section>
{/if}
