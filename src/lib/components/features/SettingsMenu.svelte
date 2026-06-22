<script lang="ts">
  import LanguageSelector from "$lib/components/features/LanguageSelector.svelte";
  import ThemeToggle from "$lib/components/features/ThemeToggle.svelte";
  import VerificationSelector from "$lib/components/features/VerificationSelector.svelte";
  import Popover from "$lib/components/ui/Popover.svelte";
  import { falseAlertSound } from "$lib/stores/alerts";

  // Groups the "set once and forget" controls (transcription language,
  // verification depth, false-claim alert sound, theme) behind one labelled
  // popover, so the header keeps only the primary action and view controls.
</script>

<Popover label="Réglages" panelClass="w-72">
  {#snippet trigger({ toggle, open })}
    <button
      type="button"
      class="flex h-8 cursor-pointer items-center gap-1.5 rounded-full border border-edge bg-surface px-3 text-xs text-fg-muted transition-colors hover:border-edge-hi hover:text-fg"
      aria-haspopup="dialog"
      aria-expanded={open}
      title="Réglages"
      onclick={toggle}>
      <span aria-hidden="true">⚙</span>
      <span class="font-medium text-fg">Réglages</span>
      <span class="text-fg-faint" aria-hidden="true">▾</span>
    </button>
  {/snippet}

  <div class="border-b border-edge px-4 py-2.5">
    <span class="text-sm font-semibold text-fg">Réglages</span>
  </div>

  <div class="flex flex-col gap-4 p-4">
    <section class="flex flex-col gap-2">
      <span
        class="text-2xs font-semibold tracking-wide text-fg-faint uppercase">
        Langue de transcription
      </span>
      <LanguageSelector />
    </section>

    <section class="flex flex-col gap-2">
      <span
        class="text-2xs font-semibold tracking-wide text-fg-faint uppercase">
        Mode de vérification
      </span>
      <VerificationSelector />
    </section>

    <section class="flex flex-col gap-2">
      <span
        class="text-2xs font-semibold tracking-wide text-fg-faint uppercase">
        Alerte sur claim faux
      </span>
      <div
        class="flex h-8 w-full items-center gap-0.5 rounded-full border border-edge bg-surface p-0.5"
        role="group"
        aria-label="Alerte sur claim faux">
        <button
          type="button"
          aria-pressed={$falseAlertSound}
          title="Son d'alerte activé"
          class={[
            "flex h-full flex-1 cursor-pointer items-center justify-center gap-1 rounded-full text-xs transition-colors",
            $falseAlertSound
              ? "bg-surface-selected font-medium text-fg"
              : "text-fg-muted hover:text-fg"
          ]}
          onclick={() => falseAlertSound.set(true)}>
          <span aria-hidden="true">🔔</span>
          <span>Son activé</span>
        </button>
        <button
          type="button"
          aria-pressed={!$falseAlertSound}
          title="Son d'alerte coupé"
          class={[
            "flex h-full flex-1 cursor-pointer items-center justify-center gap-1 rounded-full text-xs transition-colors",
            !$falseAlertSound
              ? "bg-surface-selected font-medium text-fg"
              : "text-fg-muted hover:text-fg"
          ]}
          onclick={() => falseAlertSound.set(false)}>
          <span aria-hidden="true">🔕</span>
          <span>Muet</span>
        </button>
      </div>
    </section>

    <section class="flex flex-col gap-2">
      <span
        class="text-2xs font-semibold tracking-wide text-fg-faint uppercase">
        Thème
      </span>
      <ThemeToggle />
    </section>
  </div>
</Popover>
