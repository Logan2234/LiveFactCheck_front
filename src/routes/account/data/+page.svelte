<script lang="ts">
  import { resolve } from "$app/paths";
  import AccountChyron from "$lib/components/features/account/AccountChyron.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import { currentUser } from "$lib/stores/userAuth";
  import { listWebhooks } from "$lib/webhooks";

  // GDPR data access: assemble the account's data client-side from the endpoints
  // that already serve it (no dedicated export route), and offer it as a download.
  let busy = $state(false);
  let error = $state("");

  async function exportData() {
    if (busy) return;
    busy = true;
    error = "";
    try {
      const webhooks = await listWebhooks();
      const payload = {
        exported_at: new Date().toISOString(),
        account: $currentUser,
        webhooks
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `livefactchecker-${$currentUser?.username ?? "compte"}-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      error = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      busy = false;
    }
  }
</script>

<AccountChyron title="Mes données">
  {#snippet subtitle()}
    Consultez et exportez les données rattachées à votre compte.
  {/snippet}
</AccountChyron>

<div class="flex flex-col gap-6">
  <section class="border-edge bg-surface-alt rounded-xl border p-5">
    <h2 class="m-0 text-sm font-semibold">Exporter mes données</h2>
    <p class="text-fg-muted m-0 mt-1 text-sm">
      Téléchargez un fichier JSON contenant votre compte et vos alertes
      configurées.
    </p>
    {#if error}
      <p
        class="mt-4 mb-0 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2.5 text-sm text-red-300"
        role="alert">
        {error}
      </p>
    {/if}
    <div class="mt-4">
      <Button onclick={exportData} disabled={busy}>
        {busy ? "Préparation…" : "Télécharger (JSON)"}
      </Button>
    </div>
  </section>

  <section class="border-edge bg-surface-alt rounded-xl border p-5">
    <h2 class="m-0 text-sm font-semibold">Supprimer mes données</h2>
    <p class="text-fg-muted m-0 mt-1 text-sm">
      La suppression de votre compte efface définitivement toutes vos données.
      Elle se fait depuis la page
      <a
        href={resolve("/account/profile")}
        class="text-accent-light no-underline hover:underline">Compte</a
      >.
    </p>
  </section>
</div>
