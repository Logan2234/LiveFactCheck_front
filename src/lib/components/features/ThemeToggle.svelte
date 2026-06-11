<script lang="ts">
  import { theme, type Theme } from "$lib/stores/theme";

  // Three segments: auto (follow OS) · light · dark. The thumb slides to the
  // active one; clicking a segment (or arrow keys on the group) sets the theme.
  const OPTIONS: { value: Theme; label: string }[] = [
    { value: "auto", label: "Auto (suit le système)" },
    { value: "light", label: "Clair" },
    { value: "dark", label: "Sombre" }
  ];

  const activeIndex = $derived(OPTIONS.findIndex((o) => o.value === $theme));

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const dir = e.key === "ArrowRight" ? 1 : -1;
      const i = (activeIndex + dir + OPTIONS.length) % OPTIONS.length;
      theme.set(OPTIONS[i].value);
    }
  }
</script>

<div
  class="relative inline-flex h-8 w-fit shrink-0 items-center rounded-full border border-edge bg-surface p-0.5"
  role="radiogroup"
  aria-label="Thème de l'interface"
  tabindex="0"
  onkeydown={onKeydown}>
  <!-- Sliding thumb: width is 1/3 of the track, translated to the active segment. -->
  <span
    class="absolute top-0.5 bottom-0.5 left-0.5 w-[calc((100%-0.25rem)/3)] rounded-full bg-surface-selected shadow-sm transition-transform duration-200 ease-out"
    style="transform: translateX({activeIndex * 100}%)"
    aria-hidden="true">
  </span>

  {#each OPTIONS as opt (opt.value)}
    <button
      type="button"
      role="radio"
      aria-checked={$theme === opt.value}
      tabindex="-1"
      title={opt.label}
      aria-label={opt.label}
      onclick={() => theme.set(opt.value)}
      class={[
        "relative z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-transparent transition-colors duration-150",
        $theme === opt.value ? "text-fg" : "text-fg-faint hover:text-fg-muted"
      ]}>
      {#if opt.value === "auto"}
        <!-- Monitor / system -->
        <svg
          viewBox="0 0 24 24"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2">
          <rect x="3" y="4" width="18" height="12" rx="1.5" />
          <path d="M8 20h8M12 16v4" stroke-linecap="round" />
        </svg>
      {:else if opt.value === "light"}
        <!-- Sun -->
        <svg
          viewBox="0 0 24 24"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round">
          <circle cx="12" cy="12" r="4.2" />
          <path
            d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.1 5.1l1.4 1.4M17.5 17.5l1.4 1.4M18.9 5.1l-1.4 1.4M6.5 17.5l-1.4 1.4" />
        </svg>
      {:else}
        <!-- Moon -->
        <svg
          viewBox="0 0 24 24"
          class="h-4 w-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linejoin="round">
          <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
        </svg>
      {/if}
    </button>
  {/each}
</div>
