import { browser } from "$app/environment";
import type { LanguageCode } from "$lib/languages";
import { writable } from "svelte/store";

const STORAGE_KEY = "lfc_transcription_lang";
const DEFAULT_LANGUAGE: LanguageCode = "auto";

function storedLanguage() {
  if (!browser) return DEFAULT_LANGUAGE;

  return (
    (localStorage.getItem(STORAGE_KEY) as LanguageCode) ?? DEFAULT_LANGUAGE
  );
}

export const transcriptionLanguage = writable<LanguageCode>(storedLanguage());

transcriptionLanguage.subscribe((value) => {
  if (!browser) return;

  localStorage.setItem(STORAGE_KEY, value);
});
