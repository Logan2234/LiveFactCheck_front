<script lang="ts">
  import { authFetch, clearToken } from "$lib/stores/auth";
  import { onMount } from "svelte";

  interface PromptData {
    system_prompt: string;
    claim_tool: any;
    web_search_tool: any;
    valid_statuses: string[];
    min_words: number;
    model: string;
  }

  let data = $state<PromptData | null>(null);
  let error = $state("");
  let copied = $state<string | null>(null);

  // Tailwind classes per status for the schema chips (mirrors the rgba tints).
  const STATUS_CHIP: Record<string, string> = {
    verified: "border-green-500/30 bg-green-500/12 text-green-400",
    false: "border-red-500/30 bg-red-500/12 text-red-400",
    uncertain: "border-amber-500/30 bg-amber-500/12 text-amber-400",
    unverifiable: "border-gray-500/30 bg-gray-500/15 text-gray-400"
  };

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

  function copyToClipboard(key: string, value: string) {
    navigator.clipboard.writeText(value).then(() => {
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
  <h1 class="mt-0 mb-[0.3rem] text-[1.4rem]">📋 Prompt & Outil Claude</h1>
  <p class="mt-0 mb-6 text-[0.88rem] text-fg-muted">
    Configuration exacte envoyée à l'API Anthropic à chaque appel de fact-checking.
  </p>
</header>

{#if error}
  <p
    class="rounded-lg border border-red-500/35 bg-red-500/10 px-[0.9rem] py-[0.7rem] text-[0.85rem] text-red-300"
    role="alert">
    {error}
  </p>
{:else if !data}
  <div class="flex items-center gap-[0.7rem] text-[0.9rem] text-fg-muted">
    <span
      class="spinner inline-block h-4 w-4 rounded-full border-2 border-edge-hi border-t-accent-light"
    ></span> Chargement…
  </div>
{:else}
  <div
    class="mb-6 rounded-lg border border-surface-selected bg-surface-alt px-4 py-[0.6rem] text-[0.85rem] text-[#9a9ab8]">
    Modèle actif : <strong class="text-[#c8c8ff]">{data.model}</strong>
    &nbsp;·&nbsp; min. <strong class="text-[#c8c8ff]">{data.min_words}</strong> mots pour déclencher une
    analyse
  </div>

  <section class="mb-8">
    <div class="mb-[0.6rem] flex items-center justify-between">
      <h2 class="m-0 text-base text-slate-200">Prompt système</h2>
      <button
        class="cursor-pointer rounded-md border border-edge bg-surface px-3 py-[0.3rem] text-[0.78rem] text-[#8888b0] transition-all duration-150 hover:bg-surface-raised hover:text-slate-200"
        onclick={() => copyToClipboard("prompt", data!.system_prompt)}>
        {copied === "prompt" ? "✓ Copié" : "Copier"}
      </button>
    </div>
    <pre
      class="m-0 max-h-100 overflow-x-auto overflow-y-auto rounded-[10px] border border-edge bg-[#0e0e1c] px-[1.2rem] py-4 font-mono text-[0.8rem] leading-[1.6] break-words whitespace-pre-wrap text-slate-200">{data.system_prompt}</pre>
  </section>

  <section class="mb-8">
    <div class="mb-[0.6rem] flex items-center justify-between">
      <h2 class="m-0 text-base text-slate-200">
        Outil <code class="font-mono text-[0.95em] text-[#a0a0ff]">submit_claims</code>
      </h2>
      <button
        class="cursor-pointer rounded-md border border-edge bg-surface px-3 py-[0.3rem] text-[0.78rem] text-[#8888b0] transition-all duration-150 hover:bg-surface-raised hover:text-slate-200"
        onclick={() => copyToClipboard("claim", JSON.stringify(data!.claim_tool, null, 2))}>
        {copied === "claim" ? "✓ Copié" : "Copier JSON"}
      </button>
    </div>
    <div class="mb-[0.6rem] flex flex-wrap items-center gap-[0.4rem] text-[0.8rem] text-fg-faint">
      Statuts valides :
      {#each data.valid_statuses as s}
        <span
          class="rounded-full border px-[0.55rem] py-[0.15rem] text-[0.75rem] font-medium {STATUS_CHIP[
            s
          ] ?? 'border-transparent'}">{s}</span>
      {/each}
    </div>
    <pre
      class="m-0 max-h-100 overflow-x-auto overflow-y-auto rounded-[10px] border border-edge bg-[#0e0e1c] px-[1.2rem] py-4 font-mono text-[0.8rem] leading-[1.6] break-words whitespace-pre-wrap text-slate-200">{JSON.stringify(
        data.claim_tool,
        null,
        2
      )}</pre>
  </section>

  <section class="mb-8">
    <div class="mb-[0.6rem] flex items-center justify-between">
      <h2 class="m-0 text-base text-slate-200">
        Outil <code class="font-mono text-[0.95em] text-[#a0a0ff]">web_search</code>
      </h2>
      <button
        class="cursor-pointer rounded-md border border-edge bg-surface px-3 py-[0.3rem] text-[0.78rem] text-[#8888b0] transition-all duration-150 hover:bg-surface-raised hover:text-slate-200"
        onclick={() => copyToClipboard("ws", JSON.stringify(data!.web_search_tool, null, 2))}>
        {copied === "ws" ? "✓ Copié" : "Copier JSON"}
      </button>
    </div>
    <pre
      class="m-0 max-h-100 overflow-x-auto overflow-y-auto rounded-[10px] border border-edge bg-[#0e0e1c] px-[1.2rem] py-4 font-mono text-[0.8rem] leading-[1.6] break-words whitespace-pre-wrap text-slate-200">{JSON.stringify(
        data.web_search_tool,
        null,
        2
      )}</pre>
  </section>
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
