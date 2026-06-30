<script lang="ts">
  import { resolve } from "$app/paths";
  import { currentUser, refreshMe, userToken } from "$lib/stores/userAuth";
  import { onMount } from "svelte";

  // Header entry to the account/alerts page. Loads the signed-in user once so the
  // header can show their name; falls back to a "Connexion" prompt when signed out.
  onMount(() => {
    if ($userToken) refreshMe();
  });
</script>

<a
  href={resolve("/account")}
  class="hover:border-edge-hi border-edge bg-surface text-fg-muted hover:text-fg flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-xs no-underline transition-colors"
  title="Compte et alertes">
  <span aria-hidden="true">{$currentUser ? "🔔" : "👤"}</span>
  <span class="text-fg font-medium">
    {$currentUser ? $currentUser.username : "Connexion"}
  </span>
</a>
