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

  function formatConfidence(logprob: number): { label: string; cls: string } {
    if (logprob > -0.3) return { label: "élevée", cls: "conf-high" };
    if (logprob > -0.8) return { label: "moyenne", cls: "conf-med" };
    return { label: "faible", cls: "conf-low" };
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
  <div>
    <h1>🎙️ Test Whisper</h1>
    <p>
      Transcris un fichier audio et inspecte les segments, la langue détectée et les scores de
      confiance.
    </p>
  </div>
</header>

<!-- Drop zone -->
<div
  class="drop-zone {dragging ? 'drag-over' : ''} {file ? 'has-file' : ''}"
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
    <span class="file-name">🎵 {file.name}</span>
    <span class="file-size">{(file.size / 1024).toFixed(0)} Ko</span>
  {:else}
    <span class="drop-hint">Glisser un fichier audio ici ou cliquer pour choisir</span>
    <span class="drop-formats">WebM · MP3 · WAV · OGG · M4A · FLAC</span>
  {/if}
</div>

<div class="actions">
  {#if file}
    <button
      class="ghost"
      onclick={() => {
        file = null;
        result = null;
        error = "";
      }}>Retirer</button>
  {/if}
  <span class="spacer"></span>
  <button class="primary" onclick={submit} disabled={!file || loading}>
    {loading ? "Transcription…" : "Transcrire"}
  </button>
</div>

{#if loading}
  <div class="loading">
    <span class="spinner"></span> En cours — peut prendre quelques secondes…
  </div>
{/if}

{#if error}
  <p class="error" role="alert">{error}</p>
{/if}

{#if result && !error}
  <!-- Métriques globales -->
  <div class="metrics">
    <div class="metric">
      <span class="metric-label">Langue</span>
      <span class="metric-val"
        >{result.language.toUpperCase()}
        <span class="sub">{(result.language_probability * 100).toFixed(0)} %</span></span>
    </div>
    {#if result.duration_s !== null}
      <div class="metric">
        <span class="metric-label">Durée audio</span>
        <span class="metric-val">{result.duration_s} s</span>
      </div>
    {/if}
    <div class="metric">
      <span class="metric-label">Temps transcription</span>
      <span class="metric-val">{result.elapsed_ms} ms</span>
    </div>
    <div class="metric">
      <span class="metric-label">Segments</span>
      <span class="metric-val">{result.segments.length}</span>
    </div>
  </div>

  <!-- Texte complet -->
  {#if result.text}
    <section class="card">
      <div class="card-title">Transcription complète</div>
      <p class="transcript-text">{result.text}</p>
    </section>
  {:else}
    <p class="empty">Aucun contenu vocal détecté (VAD filtre les silences).</p>
  {/if}

  <!-- Segments -->
  {#if result.segments.length > 0}
    <section class="card">
      <div class="card-title">Segments ({result.segments.length})</div>
      <table>
        <thead>
          <tr>
            <th>Début</th>
            <th>Fin</th>
            <th>Texte</th>
            <th>Confiance</th>
            <th>No-speech</th>
          </tr>
        </thead>
        <tbody>
          {#each result.segments as seg}
            {@const conf = formatConfidence(seg.avg_logprob)}
            <tr>
              <td class="mono">{seg.start}s</td>
              <td class="mono">{seg.end}s</td>
              <td>{seg.text}</td>
              <td><span class="badge {conf.cls}">{conf.label}</span></td>
              <td class="mono {seg.no_speech_prob > 0.5 ? 'warn' : ''}"
                >{(seg.no_speech_prob * 100).toFixed(0)} %</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
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

  .drop-zone {
    border: 2px dashed #2e2e4e;
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    cursor: pointer;
    transition:
      border-color 0.15s,
      background 0.15s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    background: #0e0e1c;
  }

  .drop-zone:hover,
  .drop-zone.drag-over {
    border-color: #6a6acc;
    background: #12122a;
  }

  .drop-zone.has-file {
    border-color: #3a3a6a;
    border-style: solid;
  }

  .drop-hint {
    font-size: 0.88rem;
    color: #6a6a88;
  }
  .drop-formats {
    font-size: 0.75rem;
    color: #3a3a58;
  }
  .file-name {
    font-size: 0.9rem;
    color: #c8c8e8;
    font-weight: 500;
  }
  .file-size {
    font-size: 0.75rem;
    color: #6a6a88;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0.75rem 0 1.25rem;
  }

  .spacer {
    flex: 1;
  }

  button {
    border-radius: 8px;
    padding: 0.55rem 1.1rem;
    font-size: 0.86rem;
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

  .loading {
    display: flex;
    align-items: center;
    gap: 0.7rem;
    color: #8888a0;
    font-size: 0.9rem;
    margin-bottom: 1rem;
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

  .metrics {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }

  .metric {
    background: #161624;
    border: 1px solid #2e2e3e;
    border-radius: 10px;
    padding: 0.6rem 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    min-width: 110px;
  }

  .metric-label {
    font-size: 0.72rem;
    color: #7a7a98;
  }
  .metric-val {
    font-size: 0.92rem;
    color: #e0e0f8;
    font-weight: 600;
  }
  .metric-val .sub {
    font-size: 0.75rem;
    color: #8888a8;
    font-weight: 400;
  }

  .card {
    background: #161624;
    border: 1px solid #2e2e3e;
    border-radius: 12px;
    padding: 1.1rem 1.2rem;
    margin-bottom: 1rem;
  }

  .card-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: #c8c8e8;
    margin-bottom: 0.8rem;
    padding-bottom: 0.6rem;
    border-bottom: 1px solid #26263a;
  }

  .transcript-text {
    font-size: 0.9rem;
    color: #d0d0e8;
    line-height: 1.65;
    margin: 0;
    white-space: pre-wrap;
  }

  .empty {
    color: #5a5a78;
    font-size: 0.88rem;
    text-align: center;
    padding: 1.5rem;
    background: #0e0e1c;
    border: 1px dashed #2e2e3e;
    border-radius: 10px;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.8rem;
  }

  th {
    text-align: left;
    color: #5a5a7a;
    font-weight: 500;
    font-size: 0.74rem;
    padding: 0 0.5rem 0.5rem;
    border-bottom: 1px solid #26263a;
  }

  td {
    padding: 0.4rem 0.5rem;
    color: #b0b0c8;
    border-bottom: 1px solid #1a1a2e;
    vertical-align: top;
  }

  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }

  .mono {
    font-family: "SF Mono", "Fira Code", monospace;
    font-size: 0.76rem;
    color: #8888a8;
  }

  .warn {
    color: #f59e0b;
  }

  .badge {
    border-radius: 999px;
    padding: 0.12rem 0.5rem;
    font-size: 0.72rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .conf-high {
    background: rgba(34, 197, 94, 0.12);
    color: #4ade80;
    border: 1px solid rgba(34, 197, 94, 0.25);
  }
  .conf-med {
    background: rgba(245, 158, 11, 0.12);
    color: #fbbf24;
    border: 1px solid rgba(245, 158, 11, 0.25);
  }
  .conf-low {
    background: rgba(239, 68, 68, 0.12);
    color: #f87171;
    border: 1px solid rgba(239, 68, 68, 0.25);
  }
</style>
