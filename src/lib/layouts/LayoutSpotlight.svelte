<script lang="ts">
  import {
    STATUS_COLOR,
    STATUS_ICON,
    STATUS_LABEL
  } from "$lib/constants/status";
  import { claims, sortedClaims } from "$lib/stores/claims";
  import { formatTime } from "$lib/utils/format";

  // Most recent claim
  const spotlight = $derived(
    $claims.length > 0 ? $claims[$claims.length - 1] : null
  );

  const strip = $sortedClaims;

  let selectedId = $state<string | null>(null);

  // Shown claim: selected from strip, or default to most recent
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

<div class="flex flex-col gap-6">
  {#if shown}
    <div
      class="flex min-h-70 flex-col items-center justify-center gap-5 rounded-xl border border-t-4 border-edge bg-surface-alt px-16 py-12 text-center transition-[border-color] duration-300 border-t-(--sc)"
      style="--sc: {STATUS_COLOR[shown.status] ?? STATUS_COLOR.pending}">
      <div class="flex items-center gap-2.5">
        <span class="text-[2rem]"
          >{STATUS_ICON[shown.status] ?? STATUS_ICON.pending}</span>
        <span
          class="text-2xl font-bold tracking-widest uppercase"
          style="color: {STATUS_COLOR[shown.status] ?? STATUS_COLOR.pending}"
          >{STATUS_LABEL[shown.status] ?? STATUS_LABEL.pending}</span>
      </div>
      <blockquote
        class="m-0 max-w-170 text-[1.35rem] leading-normal text-fg italic">
        « {shown.text} »
      </blockquote>
      {#if shown.explanation}
        <p class="m-0 max-w-150 text-base leading-relaxed text-fg-muted">
          {shown.explanation}
        </p>
      {/if}
      <span class="text-sm tabular-nums text-fg-faint"
        >{formatTime(shown.timestamp)}</span>
    </div>
  {:else}
    <div
      class="flex min-h-70 flex-col items-center justify-center gap-5 rounded-xl border border-t-4 border-edge bg-surface-alt px-16 py-12 text-center transition-[border-color] duration-300 border-t-(--sc)"
      style="--sc: #333">
      <p class="m-0 text-lg text-fg-faint">
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
          <span class="text-sm"
            >{STATUS_ICON[claim.status] ?? STATUS_ICON.pending}</span>
          <span class="text-xs text-fg-muted"
            >{claim.text.slice(0, 40)}{claim.text.length > 40 ? "…" : ""}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>
