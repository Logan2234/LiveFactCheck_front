import { onMount } from "svelte";

// Run `fn` once on mount, then every `intervalMs`, and clear the interval on
//  destroy. Call it once at component init (like any rune/lifecycle helper).
export function usePolling(fn: () => void, intervalMs: number): void {
  onMount(() => {
    fn();
    const id = setInterval(fn, intervalMs);
    return () => clearInterval(id);
  });
}
