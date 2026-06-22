import { browser } from "$app/environment";
import { get, writable } from "svelte/store";
import type { Claim } from "./claims";

// Visual + (optional) audible alert when a claim is verified as "false".
// Front-only for now; a server-side webhook/notification is still a TODO.

export interface FalseAlert {
  id: string; // the claim id, so updates/dismissals stay idempotent
  text: string;
  counterClaim: string;
}

const SOUND_KEY = "lfc_false_alert_sound";

function storedSound(): boolean {
  if (!browser) return true;
  // Default on; only an explicit "off" disables the beep.
  return localStorage.getItem(SOUND_KEY) !== "off";
}

export const falseAlertSound = writable<boolean>(storedSound());

falseAlertSound.subscribe((on) => {
  if (!browser) return;
  localStorage.setItem(SOUND_KEY, on ? "on" : "off");
});

// Toasts currently shown by FalseClaimAlert; each one auto-expires.
export const falseAlerts = writable<FalseAlert[]>([]);

const ALERT_TTL_MS = 8000;
// Claim ids already alerted on, so a re-sent/updated claim doesn't beep twice.
const alerted = new Set<string>();

export function dismissFalseAlert(id: string) {
  falseAlerts.update((list) => list.filter((a) => a.id !== id));
}

export function notifyClaim(claim: Claim) {
  if (claim.status !== "false" || alerted.has(claim.id)) return;
  alerted.add(claim.id);

  falseAlerts.update((list) => [
    ...list,
    { id: claim.id, text: claim.text, counterClaim: claim.counter_claim }
  ]);

  if (browser) {
    setTimeout(() => dismissFalseAlert(claim.id), ALERT_TTL_MS);
    if (get(falseAlertSound)) playBeep();
  }
}

// A short two-tone beep synthesized on the fly — avoids shipping an audio asset.
// Reuses one AudioContext; recording starts on a user gesture, so it's unlocked.
let audioCtx: AudioContext | null = null;

function playBeep() {
  try {
    audioCtx ??= new AudioContext();
    if (audioCtx.state === "suspended") void audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(660, now + 0.12);

    // Quick attack, smooth decay so it reads as an alert, not a click.
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain).connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  } catch (e) {
    console.warn("False-claim alert beep failed:", e);
  }
}
