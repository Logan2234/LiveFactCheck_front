<script lang="ts">
  import { resolve } from "$app/paths";
  import { page } from "$app/state";

  const is404 = $derived(page.status === 404);

  const view = $derived(
    is404
      ? {
          badge: "Introuvable",
          color: "var(--color-accent)",
          title: "Aucun fait à cette adresse",
          desc: "Cette page n'existe pas, a été déplacée, ou n'a jamais été diffusée."
        }
      : {
          badge: "Hors antenne",
          color: "#ef4444",
          title: "Le direct a été interrompu",
          desc:
            page.error?.message ??
            "Une erreur inattendue est survenue côté client."
        }
  );

  function reload() {
    location.reload();
  }
</script>

<svelte:head>
  <title>{page.status} — LiveFactChecker</title>
</svelte:head>

<main
  class="flex min-h-screen items-center justify-center p-6"
  style="background: radial-gradient(900px 480px at 50% -10%, color-mix(in srgb, {view.color} 16%, transparent), transparent 60%), var(--color-background);">
  <div
    class="flex w-full max-w-md flex-col items-center gap-6 rounded-2xl border border-edge bg-surface-alt px-8 py-12 text-center shadow-elevated">
    <span
      class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-2xs font-semibold tracking-[0.18em] uppercase"
      style="color: {view.color}; border-color: color-mix(in srgb, {view.color} 40%, transparent); background: color-mix(in srgb, {view.color} 10%, transparent);">
      <span
        class="inline-block h-1.5 w-1.5 rounded-full"
        style="background: {view.color}; box-shadow: 0 0 8px {view.color};"
      ></span>
      Erreur · {view.badge}
    </span>

    <div
      class="font-display text-[7.5rem] leading-[0.85] font-extrabold tracking-tight"
      style="background: linear-gradient(180deg, {view.color}, color-mix(in srgb, {view.color} 40%, transparent)); -webkit-background-clip: text; background-clip: text; color: transparent; filter: drop-shadow(0 4px 24px color-mix(in srgb, {view.color} 30%, transparent));">
      {page.status}
    </div>

    <div class="flex flex-col gap-2">
      <h1 class="m-0 font-display text-2xl font-bold text-fg">{view.title}</h1>
      <p class="m-0 text-sm text-fg-muted">{view.desc}</p>
    </div>

    <div class="mt-1 flex flex-wrap items-center justify-center gap-3">
      <a
        href={resolve("/")}
        class="rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white no-underline transition-colors duration-150 hover:bg-accent-dim">
        ← Retour à l'application
      </a>
      {#if !is404}
        <button
          type="button"
          onclick={reload}
          class="cursor-pointer rounded-lg border border-edge bg-surface px-4 py-2.5 text-sm font-semibold text-fg-muted transition-colors duration-150 hover:bg-surface-raised hover:text-fg">
          Recharger la page
        </button>
      {/if}
    </div>
  </div>
</main>
