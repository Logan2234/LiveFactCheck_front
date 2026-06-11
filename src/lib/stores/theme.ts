import { writable } from "svelte/store";
import { browser } from "$app/environment";

// User-facing theme preference. "auto" follows the OS (prefers-color-scheme);
// "dark"/"light" force a theme. Dark is the product default: with no stored
// preference we start dark and only follow the OS once the user picks "auto".
export type Theme = "light" | "dark" | "auto";

const STORAGE_KEY = "lfc_theme";
const DEFAULT_THEME: Theme = "dark";

function storedTheme(): Theme {
  if (!browser) return DEFAULT_THEME;
  const v = localStorage.getItem(STORAGE_KEY);
  return v === "light" || v === "dark" || v === "auto" ? v : DEFAULT_THEME;
}

// Resolve "auto" against the OS; force values pass through unchanged.
function resolve(theme: Theme): "light" | "dark" {
  if (theme !== "auto") return theme;
  if (!browser) return DEFAULT_THEME === "dark" ? "dark" : "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

// The single place that drives the actual look: writes the concrete theme onto
// <html> so app.css can swap tokens. Kept in sync with the inline script in app.html.
function applyTheme(theme: Theme) {
  if (!browser) return;
  document.documentElement.setAttribute("data-theme", resolve(theme));
}

export const theme = writable<Theme>(storedTheme());

theme.subscribe((value) => {
  if (!browser) return;
  localStorage.setItem(STORAGE_KEY, value);
  applyTheme(value);
});

// Re-resolve on OS change, but only while the user is on "auto".
if (browser) {
  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      if (storedTheme() === "auto") applyTheme("auto");
    });
}
