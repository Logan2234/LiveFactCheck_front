<script lang="ts">
  import AccountChyron from "$lib/components/features/account/AccountChyron.svelte";
  import { STATUS_META } from "$lib/constants/status";
  import { falseAlertSound } from "$lib/stores/alerts";
  import type { VerificationStatus } from "$lib/stores/claims";
  import {
    defaultTriggerStatuses,
    TRIGGER_STATUSES
  } from "$lib/stores/notificationPrefs";

  // All preferences here are client-side (localStorage), like theme and layout.
  function toggleDefault(s: VerificationStatus) {
    defaultTriggerStatuses.update((list) =>
      list.includes(s) ? list.filter((x) => x !== s) : [...list, s]
    );
  }
</script>

<AccountChyron title="Notifications">
  {#snippet subtitle()}
    Ces préférences sont enregistrées sur cet appareil.
  {/snippet}
</AccountChyron>

<div class="flex flex-col gap-6">
  <!-- default trigger statuses -->
  <section class="border-edge bg-surface-alt rounded-xl border p-5">
    <h2 class="m-0 text-sm font-semibold">Statuts surveillés par défaut</h2>
    <p class="text-fg-muted m-0 mt-1 text-sm">
      Pré-sélectionnés à la création d'une nouvelle alerte. Vous pouvez toujours
      les ajuster alerte par alerte.
    </p>
    <div class="mt-4 flex flex-wrap gap-2">
      {#each TRIGGER_STATUSES as status (status)}
        {@const active = $defaultTriggerStatuses.includes(status)}
        <button
          type="button"
          aria-pressed={active}
          onclick={() => toggleDefault(status)}
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
  </section>

  <!-- in-app sound -->
  <section class="border-edge bg-surface-alt rounded-xl border p-5">
    <h2 class="m-0 text-sm font-semibold">Son sur un fait faux</h2>
    <p class="text-fg-muted m-0 mt-1 text-sm">
      Joue une brève alerte sonore dans l'application quand un fait est vérifié
      comme faux.
    </p>
    <div
      class="border-edge bg-surface mt-4 flex h-9 w-full max-w-xs items-center gap-0.5 rounded-full border p-0.5"
      role="group"
      aria-label="Son sur un fait faux">
      <button
        type="button"
        aria-pressed={$falseAlertSound}
        class={[
          "flex h-full flex-1 cursor-pointer items-center justify-center gap-1 rounded-full text-xs transition-colors",
          $falseAlertSound
            ? "bg-surface-selected text-fg font-medium"
            : "text-fg-muted hover:text-fg"
        ]}
        onclick={() => falseAlertSound.set(true)}>
        <span aria-hidden="true">🔔</span>
        <span>Son activé</span>
      </button>
      <button
        type="button"
        aria-pressed={!$falseAlertSound}
        class={[
          "flex h-full flex-1 cursor-pointer items-center justify-center gap-1 rounded-full text-xs transition-colors",
          !$falseAlertSound
            ? "bg-surface-selected text-fg font-medium"
            : "text-fg-muted hover:text-fg"
        ]}
        onclick={() => falseAlertSound.set(false)}>
        <span aria-hidden="true">🔕</span>
        <span>Muet</span>
      </button>
    </div>
  </section>
</div>
