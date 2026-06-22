import { browser } from "$app/environment";
import { writable } from "svelte/store";

// Speed/depth trade-off for fact-checking, mirrored backend-side by the
// VerificationLevel enum in backend/app/schemas/claim.py. "fast" checks against
// the model's internal knowledge only; "thorough" allows a web search.
export type VerificationLevel = "fast" | "thorough";

const STORAGE_KEY = "lfc_verification_level";
const DEFAULT_LEVEL: VerificationLevel = "thorough";

function storedLevel(): VerificationLevel {
  if (!browser) return DEFAULT_LEVEL;

  const value = localStorage.getItem(STORAGE_KEY);
  return value === "fast" || value === "thorough" ? value : DEFAULT_LEVEL;
}

export const verificationLevel = writable<VerificationLevel>(storedLevel());

verificationLevel.subscribe((value) => {
  if (!browser) return;

  localStorage.setItem(STORAGE_KEY, value);
});
