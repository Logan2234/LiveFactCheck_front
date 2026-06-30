<script lang="ts">
  import AccountChyron from "$lib/components/features/account/AccountChyron.svelte";
  import Button from "$lib/components/ui/Button.svelte";
  import {
    currentUser,
    deleteAccount,
    updateEmail,
    updatePassword
  } from "$lib/stores/userAuth";
  import { navigate } from "$lib/utils/navigation";

  const inputClass =
    "border border-edge rounded-lg bg-surface px-3.5 py-2.5 text-sm text-fg transition-[border-color] duration-150 focus:border-accent focus:outline-none";

  // --- change email ---
  let newEmail = $state("");
  let emailPassword = $state("");
  let emailBusy = $state(false);
  let emailError = $state("");
  let emailDone = $state(false);

  async function submitEmail(e: Event) {
    e.preventDefault();
    if (emailBusy) return;
    emailBusy = true;
    emailError = "";
    emailDone = false;
    try {
      await updateEmail(newEmail.trim(), emailPassword);
      emailDone = true;
      newEmail = "";
      emailPassword = "";
    } catch (err) {
      emailError = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      emailBusy = false;
    }
  }

  // --- change password ---
  let currentPassword = $state("");
  let nextPassword = $state("");
  let confirmPassword = $state("");
  let pwBusy = $state(false);
  let pwError = $state("");
  let pwDone = $state(false);

  let pwMismatch = $derived(
    confirmPassword.length > 0 && nextPassword !== confirmPassword
  );

  async function submitPassword(e: Event) {
    e.preventDefault();
    if (pwBusy || pwMismatch) return;
    pwBusy = true;
    pwError = "";
    pwDone = false;
    try {
      await updatePassword(currentPassword, nextPassword);
      pwDone = true;
      currentPassword = "";
      nextPassword = "";
      confirmPassword = "";
    } catch (err) {
      pwError = err instanceof Error ? err.message : "Erreur inconnue";
    } finally {
      pwBusy = false;
    }
  }

  // --- delete account ---
  let deletePassword = $state("");
  let deleteAck = $state(false);
  let deleteBusy = $state(false);
  let deleteError = $state("");

  async function submitDelete(e: Event) {
    e.preventDefault();
    if (deleteBusy || !deleteAck || deletePassword.length === 0) return;
    deleteBusy = true;
    deleteError = "";
    try {
      await deleteAccount(deletePassword);
      // Account and token are gone — leave the area entirely.
      await navigate("/");
    } catch (err) {
      deleteError = err instanceof Error ? err.message : "Erreur inconnue";
      deleteBusy = false;
    }
  }
</script>

<AccountChyron title="Compte">
  {#snippet subtitle()}
    Gérez vos identifiants de connexion et la suppression de votre compte.
  {/snippet}
</AccountChyron>

<div class="flex flex-col gap-6">
  <!-- email -->
  <section class="border-edge bg-surface-alt rounded-xl border p-5">
    <h2 class="m-0 text-sm font-semibold">Adresse email</h2>
    <p class="text-fg-muted m-0 mt-1 text-sm">
      Email actuel : <span class="text-fg font-medium"
        >{$currentUser?.email}</span>
    </p>
    <form class="mt-4 flex flex-col gap-4" onsubmit={submitEmail}>
      <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
        <span>Nouvel email</span>
        <input
          type="email"
          bind:value={newEmail}
          placeholder="vous@exemple.fr"
          autocomplete="email"
          required
          class={inputClass} />
      </label>
      <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
        <span>Mot de passe actuel</span>
        <input
          type="password"
          bind:value={emailPassword}
          placeholder="••••••••"
          autocomplete="current-password"
          required
          class={inputClass} />
      </label>
      {#if emailError}
        <p
          class="m-0 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2.5 text-sm text-red-300"
          role="alert">
          {emailError}
        </p>
      {/if}
      {#if emailDone}
        <p
          class="m-0 rounded-lg border border-emerald-500/40 bg-emerald-500/12 px-3 py-2.5 text-sm text-emerald-300"
          role="status">
          Email mis à jour.
        </p>
      {/if}
      <div>
        <Button type="submit" disabled={emailBusy}>
          {emailBusy ? "Mise à jour…" : "Mettre à jour l'email"}
        </Button>
      </div>
    </form>
  </section>

  <!-- password -->
  <section class="border-edge bg-surface-alt rounded-xl border p-5">
    <h2 class="m-0 text-sm font-semibold">Mot de passe</h2>
    <form class="mt-4 flex flex-col gap-4" onsubmit={submitPassword}>
      <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
        <span>Mot de passe actuel</span>
        <input
          type="password"
          bind:value={currentPassword}
          autocomplete="current-password"
          required
          class={inputClass} />
      </label>
      <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
        <span>Nouveau mot de passe</span>
        <input
          type="password"
          bind:value={nextPassword}
          autocomplete="new-password"
          minlength="8"
          required
          class={inputClass} />
      </label>
      <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
        <span>Confirmer le nouveau mot de passe</span>
        <input
          type="password"
          bind:value={confirmPassword}
          autocomplete="new-password"
          required
          class={inputClass} />
      </label>
      {#if pwMismatch}
        <p class="m-0 text-sm text-red-300" role="alert">
          Les deux mots de passe ne correspondent pas.
        </p>
      {/if}
      {#if pwError}
        <p
          class="m-0 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2.5 text-sm text-red-300"
          role="alert">
          {pwError}
        </p>
      {/if}
      {#if pwDone}
        <p
          class="m-0 rounded-lg border border-emerald-500/40 bg-emerald-500/12 px-3 py-2.5 text-sm text-emerald-300"
          role="status">
          Mot de passe modifié.
        </p>
      {/if}
      <div>
        <Button type="submit" disabled={pwBusy || pwMismatch}>
          {pwBusy ? "Modification…" : "Changer le mot de passe"}
        </Button>
      </div>
    </form>
  </section>

  <!-- danger zone -->
  <section class="rounded-xl border border-red-900/40 bg-red-500/5 p-5">
    <h2 class="m-0 text-sm font-semibold text-red-300">Supprimer le compte</h2>
    <p class="text-fg-muted m-0 mt-1 text-sm">
      Cette action est définitive : votre compte et toutes vos alertes sont
      supprimés et ne peuvent pas être récupérés.
    </p>
    <form class="mt-4 flex flex-col gap-4" onsubmit={submitDelete}>
      <label class="text-fg-muted flex flex-col gap-1.5 text-sm">
        <span>Confirmez avec votre mot de passe</span>
        <input
          type="password"
          bind:value={deletePassword}
          autocomplete="current-password"
          class={inputClass} />
      </label>
      <label class="text-fg-muted flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          bind:checked={deleteAck}
          class="accent-accent h-4 w-4" />
        Je comprends que cette action est irréversible.
      </label>
      {#if deleteError}
        <p
          class="m-0 rounded-lg border border-red-500/40 bg-red-500/12 px-3 py-2.5 text-sm text-red-300"
          role="alert">
          {deleteError}
        </p>
      {/if}
      <div>
        <Button
          type="submit"
          variant="danger"
          disabled={deleteBusy || !deleteAck || deletePassword.length === 0}>
          {deleteBusy ? "Suppression…" : "Supprimer définitivement mon compte"}
        </Button>
      </div>
    </form>
  </section>
</div>
