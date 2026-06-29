// Write `text` to the clipboard. Resolves true on success, false when the
// Clipboard API is unavailable or the write is rejected. The "copied" UI flag
// stays in each caller — this only owns the write.
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
