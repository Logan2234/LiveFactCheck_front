import { browser } from "$app/environment";
import { writable } from "svelte/store";
import type { VerificationStatus } from "./claims";

// Client-side notification preferences. Like theme, layout and the false-claim
// sound, these live in localStorage rather than on the server: they shape the
// local experience and never need to follow the account across devices.

// The verdicts an alert can fire on — the transient "pending" is never a result,
// so it's excluded. Single source of truth for both the alerts form and the
// notification preferences page.
export const TRIGGER_STATUSES: VerificationStatus[] = [
  "false",
  "uncertain",
  "unverifiable",
  "verified"
];

const KEY = "lfc_default_trigger_statuses";
const FALLBACK: VerificationStatus[] = ["false"];

function stored(): VerificationStatus[] {
  if (!browser) return FALLBACK;

  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return FALLBACK;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return FALLBACK;
    const clean = parsed.filter((s): s is VerificationStatus =>
      TRIGGER_STATUSES.includes(s as VerificationStatus)
    );
    return clean.length > 0 ? clean : FALLBACK;
  } catch {
    return FALLBACK;
  }
}

// Pre-selected verdicts when creating a NEW alert, so a user who always watches
// the same statuses doesn't re-pick them each time.
export const defaultTriggerStatuses = writable<VerificationStatus[]>(stored());

defaultTriggerStatuses.subscribe((v) => {
  if (browser) localStorage.setItem(KEY, JSON.stringify(v));
});
