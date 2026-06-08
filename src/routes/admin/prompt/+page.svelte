<script lang="ts">
  import { onMount } from "svelte";
  import { authFetch, clearToken } from "$lib/stores/auth";

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

  async function load() {
    try {
      const res = await authFetch("/admin/prompt");
      if (res.status === 401) { clearToken(); return; }
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
  <h1>📋 Prompt & Outil Claude</h1>
  <p>Configuration exacte envoyée à l'API Anthropic à chaque appel de fact-checking.</p>
</header>

{#if error}
  <p class="error" role="alert">{error}</p>
{:else if !data}
  <div class="loading">
    <span class="spinner"></span> Chargement…
  </div>
{:else}
  <div class="model-badge">
    Modèle actif : <strong>{data.model}</strong>
    &nbsp;·&nbsp; min. <strong>{data.min_words}</strong> mots pour déclencher une analyse
  </div>

  <section>
    <div class="section-header">
      <h2>Prompt système</h2>
      <button
        class="copy-btn"
        onclick={() => copyToClipboard("prompt", data!.system_prompt)}
      >
        {copied === "prompt" ? "✓ Copié" : "Copier"}
      </button>
    </div>
    <pre class="code-block">{data.system_prompt}</pre>
  </section>

  <section>
    <div class="section-header">
      <h2>Outil <code>submit_claims</code></h2>
      <button
        class="copy-btn"
        onclick={() => copyToClipboard("claim", JSON.stringify(data!.claim_tool, null, 2))}
      >
        {copied === "claim" ? "✓ Copié" : "Copier JSON"}
      </button>
    </div>
    <div class="schema-info">
      Statuts valides :
      {#each data.valid_statuses as s}
        <span class="status-chip status-{s}">{s}</span>
      {/each}
    </div>
    <pre class="code-block">{JSON.stringify(data.claim_tool, null, 2)}</pre>
  </section>

  <section>
    <div class="section-header">
      <h2>Outil <code>web_search</code></h2>
      <button
        class="copy-btn"
        onclick={() => copyToClipboard("ws", JSON.stringify(data!.web_search_tool, null, 2))}
      >
        {copied === "ws" ? "✓ Copié" : "Copier JSON"}
      </button>
    </div>
    <pre class="code-block">{JSON.stringify(data.web_search_tool, null, 2)}</pre>
  </section>
{/if}

<style>
  header h1 {
    font-size: 1.4rem;
    margin: 0 0 0.3rem;
  }

  header p {
    color: #8888a0;
    font-size: 0.88rem;
    margin: 0 0 1.5rem;
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
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .model-badge {
    font-size: 0.85rem;
    color: #9a9ab8;
    background: #1a1a2e;
    border: 1px solid #2e2e4e;
    border-radius: 8px;
    padding: 0.6rem 1rem;
    margin-bottom: 1.5rem;
  }

  .model-badge strong {
    color: #c8c8ff;
  }

  section {
    margin-bottom: 2rem;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 0.6rem;
  }

  h2 {
    font-size: 1rem;
    margin: 0;
    color: #c8c8e8;
  }

  h2 code {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.95em;
    color: #a0a0ff;
  }

  .copy-btn {
    background: #1e1e30;
    border: 1px solid #2e2e3e;
    color: #8888b0;
    border-radius: 6px;
    padding: 0.3rem 0.75rem;
    font-size: 0.78rem;
    cursor: pointer;
    transition: all 0.15s;
  }

  .copy-btn:hover {
    background: #26263a;
    color: #c8c8e8;
  }

  .schema-info {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    flex-wrap: wrap;
    font-size: 0.8rem;
    color: #7a7a98;
    margin-bottom: 0.6rem;
  }

  .status-chip {
    border-radius: 999px;
    padding: 0.15rem 0.55rem;
    font-size: 0.75rem;
    font-weight: 500;
    border: 1px solid transparent;
  }

  .status-chip.status-verified   { background: rgba(34,197,94,0.12);  color: #4ade80; border-color: rgba(34,197,94,0.3); }
  .status-chip.status-false      { background: rgba(239,68,68,0.12);  color: #f87171; border-color: rgba(239,68,68,0.3); }
  .status-chip.status-uncertain  { background: rgba(245,158,11,0.12); color: #fbbf24; border-color: rgba(245,158,11,0.3); }
  .status-chip.status-unverifiable { background: rgba(107,114,128,0.15); color: #9ca3af; border-color: rgba(107,114,128,0.3); }

  .code-block {
    background: #0e0e1c;
    border: 1px solid #2a2a3e;
    border-radius: 10px;
    padding: 1rem 1.2rem;
    font-family: "SF Mono", "Fira Code", "Cascadia Code", monospace;
    font-size: 0.8rem;
    line-height: 1.6;
    color: #c8c8e8;
    overflow-x: auto;
    white-space: pre-wrap;
    word-break: break-word;
    margin: 0;
    max-height: 400px;
    overflow-y: auto;
  }

  .error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.35);
    color: #fca5a5;
    border-radius: 8px;
    padding: 0.7rem 0.9rem;
    font-size: 0.85rem;
  }
</style>
