<script lang="ts">
  import Alert from "$lib/components/ui/Alert.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
  import StatusBadge from "$lib/components/ui/StatusBadge.svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";
  import { onMount } from "svelte";

  interface PromptData {
    system_prompt: string;
    claim_tool: unknown;
    web_search_tool: unknown;
    valid_statuses: string[];
    min_words: number;
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
      const res = await authFetch("/admin/prompt");
      if (res.status === 401) {
        clearToken();
        return;
      }
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      data = await res.json();
    } catch (e) {
      error = e instanceof Error ? e.message : "Erreur réseau";
    }
  }

  async function copyToClipboard(key: string, value: string) {
    void navigator.clipboard.writeText(value).then(() => {
      copied = key;
      setTimeout(() => (copied = null), 1800);
    });
  }

  onMount(load);
</script>

<svelte:head>
  <title>Prompt & Outil — Admin</title>
</svelte:head>

<header>
  <h1 class="mt-0 mb-1 text-2xl">ðŸ“‹ Prompt & Outil Claude</h1>
  <p class="mt-0 mb-6 text-sm text-fg-muted">
    Configuration exacte envoyée à l'API Anthropic à chaque appel de
    fact-checking.
  </p>
</header>

{#if error}
  <Alert type="error" message={error} />
{:else if !data}
  <LoadingSpinner />
{:else}
  <div
    class="mb-6 rounded-lg border border-surface-selected bg-surface-alt px-4 py-2.5 text-sm text-fg-muted">
    Modèle actif : <strong class="text-fg">{data.model}</strong>
    &nbsp;·&nbsp; min. <strong class="text-fg">{data.min_words}</strong> mots pour
    déclencher une analyse
  </div>

  {#snippet sectionHeader(key: string, label: string, json?: unknown)}
    <div class="mb-2.5 flex items-center justify-between">
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
          ? "âœ“ Copié"
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
