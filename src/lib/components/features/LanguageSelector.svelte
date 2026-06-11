<script lang="ts">
  import {
    LANGUAGES,
    languageName,
    type LanguageCode,
    type LanguageName
  } from "$lib/languages";
  import { transcriptionLanguage } from "$lib/stores/transcription";
  import { sendLanguageConfig } from "$lib/websocket";

  // Filterable combobox: "auto" + the ~100 Whisper languages. A plain <select>
  // with 100 options is unusable, so we open a searchable list instead.
  let open = $state(false);
  let query = $state("");
  let root: HTMLDivElement;

  const currentLabel = $derived(
    $transcriptionLanguage === "auto"
      ? "Auto"
      : languageName($transcriptionLanguage)
  );

  const filtered: { code: LanguageCode; name: LanguageName }[] = $derived.by(
    () => {
      const q = query.trim().toLowerCase();

      const langs = LANGUAGES.filter(
        (l) =>
          !q ||
          l.name.toLowerCase().includes(q) ||
          l.code.toLowerCase().includes(q)
      );

      const autoMatches = !q || "auto".includes(q);
      return autoMatches ? [{ code: "auto", name: "Auto" }, ...langs] : langs;
    }
  );

  function select(code: LanguageCode) {
    transcriptionLanguage.set(code);
    sendLanguageConfig(code);
    open = false;
    query = "";
  }

  function toggle() {
    open = !open;
    if (!open) query = "";
  }

  // Close on outside click / Escape.
  function onWindowClick(e: MouseEvent) {
    if (open && root && !root.contains(e.target as Node)) {
      open = false;
      query = "";
    }
  }
  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && open) {
      open = false;
      query = "";
    }
  }
</script>

<svelte:window onclick={onWindowClick} onkeydown={onKeydown} />

<div class="relative" bind:this={root}>
  <button
    type="button"
    class="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-edge bg-surface px-3 text-xs text-fg-muted transition-colors hover:border-edge-hi hover:text-fg"
    aria-haspopup="listbox"
    aria-expanded={open}
    title="Langue de transcription"
    onclick={toggle}>
    <span aria-hidden="true">🗣</span>
    <span class="font-medium text-fg">{currentLabel}</span>
    <span class="text-fg-faint" aria-hidden="true">▾</span>
  </button>

  {#if open}
    <div
      class="absolute right-0 z-20 mt-1 w-56 rounded-xl border border-edge bg-surface-raised p-1.5 shadow-lg"
      role="listbox"
      aria-label="Langue de transcription">
      <!-- svelte-ignore a11y_autofocus -->
      <input
        type="text"
        bind:value={query}
        autofocus
        placeholder="Rechercher une langue…"
        class="mb-1.5 w-full rounded-lg border border-edge bg-surface px-2.5 py-1.5 text-xs text-fg placeholder:text-fg-faint focus:border-accent focus:outline-none" />
      <div class="max-h-64 overflow-y-auto">
        {#each filtered as lang (lang.code)}
          <button
            type="button"
            role="option"
            aria-selected={$transcriptionLanguage === lang.code}
            class={[
              "flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors",
              $transcriptionLanguage === lang.code
                ? "bg-surface-selected text-fg"
                : "text-fg-muted hover:bg-surface hover:text-fg"
            ]}
            onclick={() => select(lang.code)}>
            <span>{lang.name}</span>
            {#if lang.code !== "auto"}
              <span class="font-mono text-2xs text-fg-faint uppercase"
                >{lang.code}</span>
            {/if}
          </button>
        {:else}
          <p class="px-2.5 py-2 text-xs text-fg-faint">Aucune langue trouvée</p>
        {/each}
      </div>
    </div>
  {/if}
</div>
