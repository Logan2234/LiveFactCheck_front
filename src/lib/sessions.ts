// Admin history client: reads persisted sessions from the auth-gated /sessions
// API. These types mirror the backend read schemas in
// `backend/app/schemas/history.py` — keep them in sync.

import { adminJson } from "$lib/admin";
import { authFetch } from "$lib/stores/auth";
import type { VerificationStatus } from "$lib/stores/claims";
import { triggerDownload } from "$lib/utils/export";

interface TokenTotals {
  input: number;
  output: number;
  cache_read: number;
  cache_write: number;
  total: number;
}

interface SessionStats {
  duration_s: number | null;
  transcripts_count: number;
  claims_count: number;
  claims_by_status: Record<string, number>;
  dominant_category: string | null;
  avg_confidence: number | null;
  segments_verified: number;
  rejects: number;
  web_search_segments: number;
  web_search_calls_total: number;
  claims_with_web_search: number;
  tokens: TokenTotals;
  api_calls_total: number;
  fallback_count: number;
  avg_transcribe_ms: number | null;
  avg_verify_ms: number | null;
  estimated_cost_usd: number | null;
  pricing_model: string;
}

export interface SessionSummary {
  id: string;
  started_at: string;
  ended_at: string | null;
  active: boolean;
  client_host: string;
  transcripts_count: number;
  claims_count: number;
  false_count: number;
  estimated_cost_usd: number | null;
}

interface SessionSegment {
  id: string;
  seq: number;
  text: string;
  detected_language: string;
  language_probability: number;
  created_at: string;
  transcribe_ms: number;
  verify_ms: number | null;
  tokens_input: number | null;
  tokens_output: number | null;
  tokens_cache_read: number | null;
  tokens_cache_write: number | null;
  api_calls: number | null;
  web_search_calls: number | null;
}

interface SessionClaim {
  id: string;
  segment_id: string | null;
  text: string;
  status: VerificationStatus;
  explanation: string;
  sources: string[];
  timestamp: number;
  category: string;
  confidence: number;
  counter_claim: string;
  web_search_used: boolean;
  created_at: string;
}

export interface SessionDetail {
  id: string;
  started_at: string;
  ended_at: string | null;
  active: boolean;
  client_host: string;
  chunks_received: number;
  stats: SessionStats;
  segments: SessionSegment[];
  claims: SessionClaim[];
}

export type ExportFormat = "md" | "json";

export function listSessions(): Promise<SessionSummary[]> {
  return adminJson<SessionSummary[]>("/sessions");
}

export function getSession(id: string): Promise<SessionDetail> {
  return adminJson<SessionDetail>(`/sessions/${id}`);
}

// Fetch an export with the bearer token and save it (the route is auth-gated,
// so a plain link won't carry the credential).
export async function downloadSession(
  id: string,
  format: ExportFormat
): Promise<void> {
  const res = await authFetch(`/sessions/${id}/export?format=${format}`);
  if (!res.ok) throw new Error(`Erreur ${res.status}`);
  triggerDownload(await res.blob(), `session-${id}.${format}`);
}
