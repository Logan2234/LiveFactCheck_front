// Client-side export of the *current live* session (no backend, no auth).
// A regular user can save their own in-progress session straight from the
// in-browser stores; the admin history export (past, persisted sessions with
// full stats) is a separate, auth-gated path in `$lib/sessions`.

import { STATUS_LABEL } from "$lib/constants/status";
import type { TranscriptEntry } from "$lib/stores/audio";
import type { Claim } from "$lib/stores/claims";
import { formatTime } from "./format";

export type ExportFormat = "md" | "json";

// Pending claims are transient (placeholder shown while verifying); like the
// backend, the export keeps only resolved claims.
function resolved(claims: Claim[]): Claim[] {
  return claims
    .filter((c) => c.status !== "pending")
    .sort((a, b) => a.timestamp - b.timestamp);
}

function countByStatus(claims: Claim[]): Record<string, number> {
  return claims.reduce<Record<string, number>>((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});
}

function buildJson(claims: Claim[], transcript: TranscriptEntry[]) {
  const kept = resolved(claims);
  return {
    exported_at: new Date().toISOString(),
    source: "live-session",
    stats: {
      transcripts_count: transcript.length,
      claims_count: kept.length,
      claims_by_status: countByStatus(kept)
    },
    transcript,
    claims: kept
  };
}

function buildMarkdown(claims: Claim[], transcript: TranscriptEntry[]): string {
  const kept = resolved(claims);
  const byStatus = countByStatus(kept);
  const lines: string[] = [];

  lines.push("# LiveFactChecker — session en cours");
  lines.push("");
  lines.push(`- Exporté le : ${formatTime(new Date())}`);
  lines.push(`- Transcriptions : ${transcript.length}`);
  const statusSummary = Object.entries(byStatus)
    .map(
      ([k, v]) => `${STATUS_LABEL[k as keyof typeof STATUS_LABEL] ?? k} ${v}`
    )
    .join(", ");
  lines.push(
    `- Claims : ${kept.length}${statusSummary ? ` (${statusSummary})` : ""}`
  );
  lines.push("");

  lines.push("## Claims");
  lines.push("");
  if (kept.length === 0) lines.push("_Aucun claim._");

  for (const claim of kept) {
    const label = STATUS_LABEL[claim.status] ?? claim.status;
    lines.push(`### [${label}] ${claim.text}`);
    if (claim.explanation) lines.push(`- ${claim.explanation}`);
    if (claim.counter_claim)
      lines.push(`- **Correction** : ${claim.counter_claim}`);
    const meta = `confiance ${claim.confidence}/10${claim.category ? ` · ${claim.category}` : ""}`;
    lines.push(`- _${meta}_`);
    for (const source of claim.sources) lines.push(`- Source : ${source}`);
    lines.push("");
  }

  lines.push("## Transcript");
  lines.push("");
  transcript.forEach((entry, i) => lines.push(`${i + 1}. ${entry.text}`));
  lines.push("");

  return lines.join("\n");
}

/** Trigger a browser download of `blob` under `filename`. */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function exportActiveSession(
  format: ExportFormat,
  claims: Claim[],
  transcript: TranscriptEntry[]
): void {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");

  if (format === "json") {
    const blob = new Blob(
      [JSON.stringify(buildJson(claims, transcript), null, 2)],
      {
        type: "application/json"
      }
    );
    triggerDownload(blob, `session-live-${stamp}.json`);
  } else {
    const blob = new Blob([buildMarkdown(claims, transcript)], {
      type: "text/markdown"
    });
    triggerDownload(blob, `session-live-${stamp}.md`);
  }
}
