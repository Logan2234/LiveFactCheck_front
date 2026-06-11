<script lang="ts">
  import { CLAIM_FILTERS, STATUS_COLOR, STATUS_ICON, STATUS_LABEL } from "$lib/constants/status";
  import { claimFilter, filteredClaims } from "$lib/stores/claims";
  import { formatTime } from "$lib/utils/format";

  let expandedId = $state<string | null>(null);
</script>

<div class="flex flex-col gap-3">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex flex-wrap gap-1.5">
      {#each CLAIM_FILTERS as { key, label, icon } (key)}
        <button
          class={[
            "cursor-pointer rounded-[20px] border px-3 py-1.5 text-sm transition-all duration-150",
            $claimFilter === key
              ? "border-accent-dim bg-surface-selected text-fg"
              : "border-edge bg-surface text-fg-muted hover:border-edge-hi hover:text-fg"
          ]}
          onclick={() => claimFilter.set(key)}>
          {icon}
          {label}
        </button>
      {/each}
    </div>
    <span class="text-sm whitespace-nowrap text-fg-faint"
      >{$filteredClaims.length} fait{$filteredClaims.length !== 1 ? "s" : ""}</span>
  </div>

  <div class="max-h-[calc(100vh-240px)] overflow-auto rounded-lg border border-surface">
    <table class="w-full border-collapse text-sm">
      <thead class="sticky top-0 z-1">
        <tr>
          <th
            class="w-20 border-b border-edge bg-surface px-3.5 py-2.5 text-left text-xs font-semibold tracking-wider text-fg-faint uppercase"
            >Heure</th>
          <th
            class="w-32.5 border-b border-edge bg-surface px-3.5 py-2.5 text-left text-xs font-semibold tracking-wider text-fg-faint uppercase"
            >Statut</th>
          <th
            class="min-w-50 border-b border-edge bg-surface px-3.5 py-2.5 text-left text-xs font-semibold tracking-wider text-fg-faint uppercase"
            >Affirmation</th>
          <th
            class="min-w-45 border-b border-edge bg-surface px-3.5 py-2.5 text-left text-xs font-semibold tracking-wider text-fg-faint uppercase"
            >Explication</th>
        </tr>
      </thead>
      <tbody>
        {#if $filteredClaims.length === 0}
          <tr>
            <td colspan="4" class="p-12 text-center text-fg-faint"
              >Aucun fait détecté pour le moment...</td>
          </tr>
        {:else}
          {#each $filteredClaims as claim (claim.id)}
            <tr
              class="claim-row cursor-pointer border-b border-surface-alt"
              class:expanded={expandedId === claim.id}
              style="--sc: {STATUS_COLOR[claim.status]}"
              onclick={() => (expandedId = expandedId === claim.id ? null : claim.id)}>
              <td
                class="w-20 px-3.5 py-2.5 align-top text-xs whitespace-nowrap tabular-nums text-fg-faint"
                >{formatTime(claim.timestamp)}</td>
              <td class="w-32.5 px-3.5 py-2.5 align-top whitespace-nowrap">
                <span class="text-sm font-medium" style="color: {STATUS_COLOR[claim.status]}">
                  {STATUS_ICON[claim.status]}
                  {STATUS_LABEL[claim.status]}
                </span>
              </td>
              <td class="min-w-50 px-3.5 py-2.5 align-top">
                <span
                  class={[
                    "leading-snug text-fg italic",
                    expandedId !== claim.id && "line-clamp-2"
                  ]}>
                  {claim.text}
                </span>
              </td>
              <td class="min-w-45 px-3.5 py-2.5 align-top">
                {#if claim.explanation}
                  <span
                    class={[
                      "text-sm leading-snug text-fg-muted",
                      expandedId !== claim.id && "line-clamp-2"
                    ]}>
                    {claim.explanation}
                  </span>
                {:else if claim.status === "pending"}
                  <span class="text-xs text-fg-faint italic">analyse...</span>
                {/if}
              </td>
            </tr>
          {/each}
        {/if}
      </tbody>
    </table>
  </div>
</div>

<style>
  /* Row left-accent on hover/expanded uses the JS-injected --sc; the hover
     state and the expanded class interplay are clearest kept in CSS. */
  .claim-row {
    border-left: 3px solid transparent;
    transition:
      background 0.1s,
      border-color 0.1s;
  }

  .claim-row:hover {
    background: var(--color-surface-raised);
    border-left-color: var(--sc);
  }

  .claim-row.expanded {
    background: var(--color-surface);
    border-left-color: var(--sc);
  }
</style>
