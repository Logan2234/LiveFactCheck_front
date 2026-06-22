<script lang="ts">
  import StatusIcon from "$lib/components/ui/StatusIcon.svelte";
  import { STATUS_COLOR, STATUS_LABEL } from "$lib/constants/status";
  import { claims, sortedClaims } from "$lib/stores/claims";
  import { formatTime } from "$lib/utils/format";

  const spotlight = $derived(
    $claims.length > 0 ? $claims[$claims.length - 1] : null
  );

  const strip = $sortedClaims;

  let selectedId = $state<string | null>(null);

  const shown = $derived(
    (() => {
      if (selectedId) {
        const found = $claims.find((c) => c.id === selectedId);
        if (found) return found;
      }
      return $claims.length > 0 ? $claims[$claims.length - 1] : null;
    })()
  );
</script>

<!--
  rec 08: presenter mode — massive condensed type readable from 3 m
  Barlow Condensed (font-display) for status + quote; body size for explanation.
-->
<div class="flex flex-col gap-6">
  {#if shown}
    <div
      class="flex min-h-[72vh] flex-col items-center justify-center gap-8 rounded-xl border border-edge bg-surface-alt px-10 py-16 text-center transition-[border-color] duration-300"
      style="border-top: 5px solid {STATUS_COLOR[shown.status] ??
        STATUS_COLOR.pending}">
      <!-- Status: large icon + display-font label -->
      <div class="flex items-center gap-4">
        <StatusIcon status={shown.status} size={36} />
        <span
          class="font-display text-[3.2rem] font-extrabold leading-none tracking-widest uppercase"
          style="color: {STATUS_COLOR[shown.status] ?? STATUS_COLOR.pending}">
          {STATUS_LABEL[shown.status] ?? STATUS_LABEL.pending}
        </span>
      </div>

      <!-- Main claim: condensed italic, very large -->
      <blockquote
        class="m-0 max-w-[72ch] font-display text-[2rem] font-bold leading-snug text-fg"
        style="font-style: italic;">
        « {shown.text} »
      </blockquote>

      {#if shown.explanation}
        <p class="m-0 max-w-[56ch] text-lg leading-relaxed text-fg-muted">
          {shown.explanation}
        </p>
      {/if}

      <span class="text-sm tabular-nums text-fg-faint"
        >{formatTime(shown.timestamp)}</span>
    </div>
  {:else}
    <div
      class="flex min-h-[72vh] flex-col items-center justify-center rounded-xl border border-edge bg-surface-alt px-10 py-16 text-center"
      style="border-top: 5px solid var(--color-edge)">
      <p
        class="m-0 font-display text-2xl text-fg-faint uppercase tracking-widest">
        En attente d'un fait à vérifier...
      </p>
    </div>
  {/if}

  {#if strip.length > 0}
    <div class="flex gap-2 overflow-x-auto pb-1">
      {#each strip as claim (claim.id)}
        <button
          class={[
            "flex shrink-0 cursor-pointer items-center gap-1.5 rounded-[20px] border bg-surface px-3 py-1.5 whitespace-nowrap transition-all duration-150",
            selectedId === claim.id ||
            (!selectedId && claim.id === spotlight?.id)
              ? "border-(--sc) bg-surface-selected"
              : "border-edge hover:border-(--sc)"
          ]}
          style="--sc: {STATUS_COLOR[claim.status] ?? STATUS_COLOR.pending}"
          onclick={() =>
            (selectedId = claim.id === selectedId ? null : claim.id)}
          title={claim.text}>
          <!-- rec 04: SVG icon in strip buttons -->
          <StatusIcon status={claim.status} size={13} />
          <span class="text-xs text-fg-muted"
            >{claim.text.slice(0, 40)}{claim.text.length > 40 ? "…" : ""}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
