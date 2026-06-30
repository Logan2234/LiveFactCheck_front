import { writable } from "svelte/store";

export type Layout =
  | "classic"
  | "dashboard"
  | "spotlight"
  | "trustmeter"
  | "ticker";

export const activeLayout = writable<Layout>("classic");
