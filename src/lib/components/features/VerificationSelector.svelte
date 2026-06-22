<script lang="ts">
  import {
    verificationLevel,
    type VerificationLevel
  } from "$lib/stores/verification";
  import { sendConfig } from "$lib/websocket";

  // Two-option segmented toggle: speed vs depth. "fast" skips web search for a
  // single quick API call; "thorough" lets the model look facts up online.
  const OPTIONS: {
    value: VerificationLevel;
    label: string;
    icon: string;
    title: string;
  }[] = [
    {
      value: "fast",
      label: "Rapide",
      icon: "⚡",
      title:
        "Vérification rapide — connaissances internes du modèle, sans recherche web"
    },
    {
      value: "thorough",
      label: "Approfondi",
      icon: "🌐",
      title:
        "Vérification approfondie — recherche web autorisée pour les faits récents (plus lent)"
    }
  ];

  function select(level: VerificationLevel) {
    if ($verificationLevel === level) return;
    verificationLevel.set(level);
    sendConfig();
  }
</script>

<div
  class="flex h-8 w-full items-center gap-0.5 rounded-full border border-edge bg-surface p-0.5"
  role="group"
  aria-label="Niveau de vérification">
  {#each OPTIONS as opt (opt.value)}
    <button
      type="button"
      title={opt.title}
      aria-pressed={$verificationLevel === opt.value}
      class={[
        "flex h-full flex-1 cursor-pointer items-center justify-center gap-1 rounded-full text-xs transition-colors",
        $verificationLevel === opt.value
          ? "bg-surface-selected font-medium text-fg"
          : "text-fg-muted hover:text-fg"
      ]}
      onclick={() => select(opt.value)}>
      <span aria-hidden="true">{opt.icon}</span>
      <span>{opt.label}</span>
    </button>
  {/each}
</div>
