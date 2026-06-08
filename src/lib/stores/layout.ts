import { writable } from "svelte/store";

export type Layout =
  | "classic"
  | "dashboard"
  | "terminal"
  | "spotlight"
  | "table"
  | "trustmeter"
  | "ticker"
  | "timeline"
  | "chat";

export const activeLayout = writable<Layout>("classic");
