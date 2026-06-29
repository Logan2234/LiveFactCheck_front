<script lang="ts">
  import { AdminAuthError, adminJson } from "$lib/admin";
  import Alert from "$lib/components/ui/Alert.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import LoadingSpinner from "$lib/components/ui/LoadingSpinner.svelte";
  import Metric from "$lib/components/ui/Metric.svelte";
  import PageHeader from "$lib/components/ui/PageHeader.svelte";
  import StatusBadge from "$lib/components/ui/StatusBadge.svelte";
  import { formatPercent } from "$lib/utils/format";

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

  function formatConfidence(logprob: number): {
    label: string;
    color: "green" | "amber" | "red";
  } {
    if (logprob > -0.3) return { label: "élevée", color: "green" };
    if (logprob > -0.8) return { label: "moyenne", color: "amber" };
    return { label: "faible", color: "red" };
  }

  async function submit() {
    if (!file || loading) return;
    loading = true;
    result = null;
    error = "";
    try {
      const form = new FormData();
      form.append("file", file);
      result = await adminJson<TranscribeResult>("/admin/whisper/transcribe", {
        method: "POST",
        body: form
      });
      if (result?.error) error = result.error;
    } catch (e) {
      if (e instanceof AdminAuthError) return;
      error = e instanceof Error ? e.message : "Erreur réseau";
    } finally {
      loading = false;
    }
  }
</script>

<svelte:head>
  <title>Test Whisper — Admin</title>
</svelte:head>

<PageHeader
  title="🎙️ Test Whisper"
  subtitle="Transcris un fichier audio et inspecte les segments, la langue détectée et les scores de confiance." />

<!-- Drop zone -->
<div
  class={[
    "flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 border-dashed bg-surface-term p-8 text-center transition-[border-color,background] duration-150",
    dragging
      ? "border-accent bg-surface-raised"
      : file
        ? "border-solid border-edge-hi"
        : "border-surface-selected hover:border-accent hover:bg-surface-raised"
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
  onkeydown={(e) =>
    e.key === "Enter" && document.getElementById("audio-input")?.click()}>
  <input
    id="audio-input"
    type="file"
    accept="audio/*,.webm,.ogg,.mp3,.wav,.m4a,.flac"
    onchange={onFileInput}
    style="display:none" />
  {#if file}
    <span class="text-sm font-medium text-fg">🎵 {file.name}</span>
    <span class="text-xs text-fg-faint"
      >{(file.size / 1024).toFixed(0)} Ko</span>
  {:else}
    <span class="text-sm text-fg-faint"
      >Glisser un fichier audio ici ou cliquer pour choisir</span>
    <span class="text-xs text-fg-faint/50"
      >WebM · MP3 · WAV · OGG · M4A · FLAC</span>
  {/if}
</div>

<div class="mt-3 mb-5 flex items-center gap-2">
  {#if file}
    <Button
      variant="secondary"
      onclick={() => {
        file = null;
        result = null;
        error = "";
      }}>Retirer</Button>
  {/if}
  <Button class="ml-auto" onclick={submit} disabled={!file || loading}>
    {loading ? "Transcription…" : "Transcrire"}
  </Button>
</div>

{#if loading}
  <div class="mb-4">
    <LoadingSpinner message="En cours — peut prendre quelques secondes…" />
  </div>
{/if}

{#if error}
  <Alert type="error" message={error} />
{/if}

{#if result && !error}
  <!-- Métriques globales -->
  <div class="mb-4 flex flex-wrap gap-3">
    {#each [{ label: "Langue", value: `${result.language.toUpperCase()} (${formatPercent(result.language_probability)})` }, ...(result.duration_s !== null ? [{ label: "Durée audio", value: `${result.duration_s} s` }] : []), { label: "Temps transcription", value: `${result.elapsed_ms} ms` }, { label: "Segments", value: String(result.segments.length) }] as stat (stat.label)}
      <Metric label={stat.label} value={stat.value} />
    {/each}
  </div>

  <!-- Texte complet -->
  {#if result.text}
    <section
      class="mb-4 rounded-xl border border-edge bg-surface-alt px-5 py-4">
      <div
        class="mb-3 border-b border-surface-raised pb-2.5 text-sm font-semibold text-fg">
        Transcription complète
      </div>
      <p class="m-0 text-sm leading-relaxed whitespace-pre-wrap text-fg">
        {result.text}
      </p>
    </section>
  {:else}
    <p
      class="rounded-xl border border-dashed border-edge bg-surface-term p-6 text-center text-sm text-fg-faint">
      Aucun contenu vocal détecté (VAD filtre les silences).
    </p>
  {/if}

  <!-- Segments -->
  {#if result.segments.length > 0}
    <section
      class="mb-4 rounded-xl border border-edge bg-surface-alt px-5 py-4">
      <div
        class="mb-3 border-b border-surface-raised pb-2.5 text-sm font-semibold text-fg">
        Segments ({result.segments.length})
      </div>
      <table class="w-full border-collapse text-sm">
        <thead>
          <tr>
            {#each ["Début", "Fin", "Texte", "Confiance", "No-speech"] as col (col)}
              <th
                class="border-b border-surface-raised px-2 pt-0 pb-2 text-left text-2xs font-medium text-fg-faint"
                >{col}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each result.segments as seg (seg)}
            {@const conf = formatConfidence(seg.avg_logprob)}
            <tr>
              <td
                class="border-b border-surface-alt px-2 py-1.5 align-top font-mono text-xs text-fg-faint"
                >{seg.start}s</td>
              <td
                class="border-b border-surface-alt px-2 py-1.5 align-top font-mono text-xs text-fg-faint"
                >{seg.end}s</td>
              <td
                class="border-b border-surface-alt px-2 py-1.5 align-top text-fg-muted"
                >{seg.text}</td>
              <td class="border-b border-surface-alt px-2 py-1.5 align-top">
                <StatusBadge color={conf.color} label={conf.label} />
              </td>
              <td
                class={[
                  "border-b border-surface-alt px-2 py-1.5 align-top font-mono text-xs",
                  seg.no_speech_prob > 0.5 ? "text-amber-500" : "text-fg-faint"
                ]}>
                {formatPercent(seg.no_speech_prob)}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </section>
  {/if}
{/if}

<style>
  tr:last-child td {
    border-bottom: none;
  }
  tr:hover td {
    background: rgba(255, 255, 255, 0.02);
  }
</style>
