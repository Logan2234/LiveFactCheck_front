import { writable } from "svelte/store";

export type Layout =
  | "classic"
  | "newsroom"
  | "dashboard"
  | "terminal"
  | "kanban"
  | "spotlight"
  | "table"
  | "annotation"
  | "trustmeter"
  | "ticker"
  | "timeline"
  | "chat"
  | "radial";

export const activeLayout = writable<Layout>("classic");
