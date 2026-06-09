<script lang="ts">
  import { authFetch, clearToken } from "$lib/stores/auth";

  interface Segment {
    start: number;
    end: number;
    text: string;
    avg_logprob: number;
    no_speech_prob: number;
  }

  interface TranscribeResult {
    text: string;
    language: string;
    language_probability: number;
    duration_s: number | null;
    elapsed_ms: number;
    segments: Segment[];
    error?: string;
  }

  let file = $state<File | null>(null);
  let result = $state<TranscribeResult | null>(null);
  let loading = $state(false);
  let error = $state("");
  let dragging = $state(false);

  function onFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (input.files?.[0]) file = input.files[0];
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragging = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) file = f;
  }

  // cls holds the Tailwind classes for the confidence badge (green/amber/red tints).
  function formatConfidence(logprob: number): { label: string; cls: string } {
    if (logprob > -0.3)
      return { label: "élevée", cls: "border-green-500/25 bg-green-500/12 text-green-400" };
    if (logprob > -0.8)
      return { label: "moyenne", cls: "border-amber-500/25 bg-amber-500/12 text-amber-400" };
    return { label: "faible", cls: "border-red-500/25 bg-red-500/12 text-red-400" };
  }

  async function submit() {
    if (!file || loading) return;
    loading = true;
    result = null;
    error = "";
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await authFetch("/admin/whisper/transcribe", { method: "POST", body: form });
      if (res.status === 401) {
        clearToken();
        return;
      }
      if (!res.ok) {
        const detail = await res.json().catch(() => null);
        throw new Error(detail?.detail ?? `Erreur ${res.status}`);
      }
      result = await res.json();
      if (result?.error) error = result.error;
    } catch (e) {
      error = e instanceof Error ? e.message : "Erreur réseau";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Test Whisper — Admin</title>
</svelte:head>

<header>
  <h1 class="mt-0 mb-[0.3rem] text-[1.4rem]">🎙️ Test Whisper</h1>
  <p class="mt-0 mb-6 text-[0.88rem] text-fg-muted">
    Transcris un fichier audio et inspecte les segments, la langue détectée et les scores de
    confiance.
  </p>
</header>

<!-- Drop zone -->
<div
  class={[
    "flex cursor-pointer flex-col items-center gap-[0.4rem] rounded-xl border-2 border-dashed bg-[#0e0e1c] p-8 text-center transition-[border-color,background] duration-150",
    dragging
      ? "border-accent bg-[#12122a]"
      : file
        ? "border-solid border-[#3a3a6a]"
        : "border-surface-selected hover:border-accent hover:bg-[#12122a]"
  ]}
  role="button"
  tabindex="0"
  ondragover={(e) => {
    e.preventDefault();
    dragging = true;
  }}
  ondragleave={() => (dragging = false)}
  ondrop={onDrop}
  onclick={() => document.getElementById("audio-input")?.click()}
  onkeydown={(e) => e.key === "Enter" && document.getElementById("audio-input")?.click()}>
  <input
    id="audio-input"
    type="file"
    accept="audio/*,.webm,.ogg,.mp3,.wav,.m4a,.flac"
    onchange={onFileInput}
    style="display:none" />
  {#if file}
    <span class="text-[0.9rem] font-medium text-slate-200">🎵 {file.name}</span>
    <span class="text-[0.75rem] text-fg-faint">{(file.size / 1024).toFixed(0)} Ko</span>
  {:else}
    <span class="text-[0.88rem] text-fg-faint"
      >Glisser un fichier audio ici ou cliquer pour choisir</span>
    <span class="text-[0.75rem] text-[#3a3a58]">WebM · MP3 · WAV · OGG · M4A · FLAC</span>
  {/if}
</div>

<div class="mt-3 mb-5 flex items-center gap-2">
  {#if file}
    <button
      class="cursor-pointer rounded-lg border border-edge bg-surface px-[1.1rem] py-[0.55rem] text-[0.86rem] font-semibold text-slate-300 transition-all duration-150 enabled:hover:bg-surface-raised disabled:cursor-not-allowed disabled:opacity-40"
      onclick={() => {
        file = null;
        result = null;
        error = "";
      }}>Retirer</button>
  {/if}
  <span class="flex-1"></span>
  <button
    class="cursor-pointer rounded-lg border-none bg-[linear-gradient(135deg,#5a5ad0,#7a4ad0)] px-[1.1rem] py-[0.55rem] text-[0.86rem] font-semibold text-white transition-all duration-150 enabled:hover:opacity-88 disabled:cursor-not-allowed disabled:opacity-40"
    onclick={submit}
    disabled={!file || loading}>
    {loading ? "Transcription…" : "Transcrire"}
  </button>
</div>

{#if loading}
  <div class="mb-4 flex items-center gap-[0.7rem] text-[0.9rem] text-fg-muted">
    <span
      class="spinner inline-block h-4 w-4 shrink-0 rounded-full border-2 border-edge-hi border-t-accent-light"
    ></span> En cours — peut prendre quelques secondes…
  </div>
{/if}

{#if error}
  <p
    class="mb-4 rounded-lg border border-red-500/35 bg-red-500/10 px-[0.9rem] py-[0.7rem] text-[0.85rem] text-red-300"
    role="alert">
    {error}
  </p>
{/if}

{#if result && !error}
  <!-- Métriques globales -->
  <div class="mb-4 flex flex-wrap gap-3">
    <div
      class="flex min-w-27.5 flex-col gap-[0.2rem] rounded-[10px] border border-edge bg-surface-alt px-4 py-[0.6rem]">
      <span class="text-[0.72rem] text-fg-faint">Langue</span>
      <span class="text-[0.92rem] font-semibold text-slate-100"
        >{result.language.toUpperCase()}
        <span class="text-[0.75rem] font-normal text-[#8888a8]"
          >{(result.language_probability * 100).toFixed(0)} %</span
        ></span>
    </div>
    {#if result.duration_s !== null}
      <div
        class="flex min-w-27.5 flex-col gap-[0.2rem] rounded-[10px] border border-edge bg-surface-alt px-4 py-[0.6rem]">
        <span class="text-[0.72rem] text-fg-faint">Durée audio</span>
        <span class="text-[0.92rem] font-semibold text-slate-100">{result.duration_s} s</span>
      </div>
    {/if}
    <div
      class="flex min-w-27.5 flex-col gap-[0.2rem] rounded-[10px] border border-edge bg-surface-alt px-4 py-[0.6rem]">
      <span class="text-[0.72rem] text-fg-faint">Temps transcription</span>
      <span class="text-[0.92rem] font-semibold text-slate-100">{result.elapsed_ms} ms</span>
    </div>
    <div
      class="flex min-w-27.5 flex-col gap-[0.2rem] rounded-[10px] border border-edge bg-surface-alt px-4 py-[0.6rem]">
      <span class="text-[0.72rem] text-fg-faint">Segments</span>
      <span class="text-[0.92rem] font-semibold text-slate-100">{result.segments.length}</span>
    </div>
  </div>

  <!-- Texte complet -->
  {#if result.text}
    <section class="mb-4 rounded-xl border border-edge bg-surface-alt px-[1.2rem] py-[1.1rem]">
      <div
        class="mb-[0.8rem] border-b border-surface-raised pb-[0.6rem] text-[0.85rem] font-semibold text-slate-200">
        Transcription complète
      </div>
      <p class="m-0 text-[0.9rem] leading-[1.65] whitespace-pre-wrap text-[#d0d0e8]">
        {result.text}
      </p>
    </section>
  {:else}
    <p
      class="rounded-[10px] border border-dashed border-edge bg-[#0e0e1c] p-6 text-center text-[0.88rem] text-fg-faint">
      Aucun contenu vocal détecté (VAD filtre les silences).
    </p>
  {/if}

  <!-- Segments -->
  {#if result.segments.length > 0}
    <section class="mb-4 rounded-xl border border-edge bg-surface-alt px-[1.2rem] py-[1.1rem]">
      <div
        class="mb-[0.8rem] border-b border-surface-raised pb-[0.6rem] text-[0.85rem] font-semibold text-slate-200">
        Segments ({result.segments.length})
      </div>
      <table class="w-full border-collapse text-[0.8rem]">
        <thead>
          <tr>
            <th
              class="border-b border-surface-raised px-2 pt-0 pb-2 text-left text-[0.74rem] font-medium text-[#5a5a7a]"
              >Début</th>
            <th
              class="border-b border-surface-raised px-2 pt-0 pb-2 text-left text-[0.74rem] font-medium text-[#5a5a7a]"
              >Fin</th>
            <th
              class="border-b border-surface-raised px-2 pt-0 pb-2 text-left text-[0.74rem] font-medium text-[#5a5a7a]"
              >Texte</th>
            <th
              class="border-b border-surface-raised px-2 pt-0 pb-2 text-left text-[0.74rem] font-medium text-[#5a5a7a]"
              >Confiance</th>
            <th
              class="border-b border-surface-raised px-2 pt-0 pb-2 text-left text-[0.74rem] font-medium text-[#5a5a7a]"
              >No-speech</th>
          </tr>
        </thead>
        <tbody>
          {#each result.segments as seg}
            {@const conf = formatConfidence(seg.avg_logprob)}
            <tr>
              <td
                class="border-b border-surface-alt px-2 py-[0.4rem] align-top font-mono text-[0.76rem] text-[#8888a8]"
                >{seg.start}s</td>
              <td
                class="border-b border-surface-alt px-2 py-[0.4rem] align-top font-mono text-[0.76rem] text-[#8888a8]"
                >{seg.end}s</td>
              <td class="border-b border-surface-alt px-2 py-[0.4rem] align-top text-slate-300"
                >{seg.text}</td>
              <td class="border-b border-surface-alt px-2 py-[0.4rem] align-top text-slate-300"
                ><span
                  class="rounded-full border px-2 py-[0.12rem] text-[0.72rem] font-medium whitespace-nowrap {conf.cls}"
                  >{conf.label}</span
                ></td>
              <td
                class={[
                  "border-b border-surface-alt px-2 py-[0.4rem] align-top font-mono text-[0.76rem]",
                  seg.no_speech_prob > 0.5 ? "text-amber-500" : "text-[#8888a8]"
                ]}>{(seg.no_speech_prob * 100).toFixed(0)} %</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
{/if}

<style>
  /* Loading spinner rotation, plus table-row interactions that depend on the
     parent <tr> state — neither maps cleanly to utilities. */
  .spinner {
    animation: spin 0.7s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }
</style>
