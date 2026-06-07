import { derived, writable } from "svelte/store";

export type VerificationStatus = "pending" | "verified" | "false" | "uncertain" | "unverifiable";
export type ClaimFilter = "all" | VerificationStatus;

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
export const claimFilter = writable<ClaimFilter>("all");

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

export const sortedClaims = derived(claims, ($claims) => [...$claims].reverse());

export const filteredClaims = derived([sortedClaims, claimFilter], ([$sortedClaims, $filter]) => {
  if ($filter === "all") return $sortedClaims;
  return $sortedClaims.filter((c) => c.status === $filter);
});

export const claimStats = derived(claims, ($claims) => ({
  total: $claims.length,
  verified: $claims.filter((c) => c.status === "verified").length,
  false: $claims.filter((c) => c.status === "false").length,
  pending: $claims.filter((c) => c.status === "pending").length,
  uncertain: $claims.filter((c) => c.status === "uncertain").length,
  unverifiable: $claims.filter((c) => c.status === "unverifiable").length
}));
