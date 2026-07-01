import { derived, writable } from "svelte/store";

export type VerificationStatus =
  "pending" | "verified" | "false" | "uncertain" | "unverifiable";

export interface Claim {
  id: string;
  text: string;
  status: VerificationStatus;
  explanation: string;
  sources: string[];
  timestamp: number;
  category: string;
  confidence: number;
  counter_claim: string;
  web_search_used: boolean;
}

export const claims = writable<Claim[]>([]);
// Empty set = no filter applied (show every status/category).
export const claimFilter = writable<Set<VerificationStatus>>(new Set());
export const categoryFilter = writable<Set<string>>(new Set());
export const minConfidence = writable<number>(0);

function toggleInSet<T>(set: Set<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export function toggleStatusFilter(status: VerificationStatus) {
  claimFilter.update((set) => toggleInSet(set, status));
}

export function toggleCategoryFilter(category: string) {
  categoryFilter.update((set) => toggleInSet(set, category));
}

// Build a complete Claim from a partial API payload, filling defaults.
//  Used by the admin test/benchmark pages that POST raw text to /fact-check.
export function makeClaim(raw: Partial<Claim>, id: string): Claim {
  return {
    id,
    text: raw.text ?? "",
    status: raw.status ?? "uncertain",
    explanation: raw.explanation ?? "",
    sources: raw.sources ?? [],
    timestamp: Date.now(),
    category: raw.category ?? "",
    confidence: raw.confidence ?? 0,
    counter_claim: raw.counter_claim ?? "",
    web_search_used: raw.web_search_used ?? false
  };
}

export function removeClaim(id: string) {
  claims.update((current) => current.filter((c) => c.id !== id));
}

export function addOrUpdateClaim(claim: Claim) {
  claims.update((current) => {
    const index = current.findIndex((c) => c.id === claim.id);

    if (index >= 0) {
      const updated = [...current];
      updated[index] = claim;
      return updated;
    }

    return [...current, claim];
  });
}

export const sortedClaims = derived(claims, ($claims) =>
  [...$claims].reverse()
);

export const filteredClaims = derived(
  [sortedClaims, claimFilter, categoryFilter, minConfidence],
  ([$sortedClaims, $statusFilter, $categoryFilter, $minConfidence]) =>
    $sortedClaims.filter(
      (c) =>
        ($statusFilter.size === 0 || $statusFilter.has(c.status)) &&
        ($categoryFilter.size === 0 || $categoryFilter.has(c.category)) &&
        c.confidence >= $minConfidence
    )
);

export const claimStats = derived(claims, ($claims) => ({
  total: $claims.length,
  verified: $claims.filter((c) => c.status === "verified").length,
  false: $claims.filter((c) => c.status === "false").length,
  pending: $claims.filter((c) => c.status === "pending").length,
  uncertain: $claims.filter((c) => c.status === "uncertain").length,
  unverifiable: $claims.filter((c) => c.status === "unverifiable").length
}));
