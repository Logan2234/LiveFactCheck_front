<script lang="ts">
  import { resolve } from "$app/paths";
  import AccountChyron from "$lib/components/features/account/AccountChyron.svelte";
  import Icon, { type IconName } from "$lib/components/ui/Icon.svelte";
  import { currentUser } from "$lib/stores/userAuth";
  import { formatDate } from "$lib/utils/format";
  import type { StaticRouteId } from "$lib/utils/navigation";

  // The account home: a hub onto every part of the user's space, not a dashboard
  // for one feature. Each card is an equal-weight entry into a section.
  const sections: {
    href: StaticRouteId;
    icon: IconName;
    title: string;
    desc: string;
  }[] = [
    {
      href: "/account/alerts",
      icon: "bell",
      title: "Alertes",
      desc: "Recevez une requête sur votre endpoint dès qu'un fait surveillé apparaît."
    },
    {
      href: "/account/notifications",
      icon: "send",
      title: "Notifications",
      desc: "Choisissez les verdicts surveillés par défaut et le son d'alerte."
    },
    {
      href: "/account/profile",
      icon: "user",
      title: "Compte",
      desc: "Email, mot de passe et suppression du compte."
    },
    {
      href: "/account/data",
      icon: "package",
      title: "Mes données",
      desc: "Exportez ou supprimez les données liées à votre compte."
    }
  ];
</script>

{#if $currentUser}
  <AccountChyron title="Bonjour, {$currentUser.username}">
    {#snippet subtitle()}
      Membre depuis {formatDate($currentUser.created_at)} · {$currentUser.email}
    {/snippet}
  </AccountChyron>

  <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
    {#each sections as section (section.href)}
      <a
        href={resolve(section.href)}
        class="group border-edge bg-surface-alt hover:border-edge-hi flex items-start gap-4 rounded-xl border p-5 no-underline transition-colors">
        <span
          class="bg-surface text-accent-light flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
          <Icon name={section.icon} size={20} />
        </span>
        <span class="flex min-w-0 flex-col gap-1">
          <span class="text-fg flex items-center gap-2 font-semibold">
            {section.title}
            <span
              class="text-fg-faint transition-transform group-hover:translate-x-0.5"
              aria-hidden="true">→</span>
          </span>
          <span class="text-fg-muted text-sm">{section.desc}</span>
        </span>
      </a>
    {/each}
  </div>
{/if}
