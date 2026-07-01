import { get } from "svelte/store";
import { beforeEach, describe, expect, it } from "vitest";
import {
  categoryFilter,
  claimFilter,
  claims,
  filteredClaims,
  makeClaim,
  minConfidence,
  toggleCategoryFilter,
  toggleStatusFilter
} from "$lib/stores/claims";

function claim(overrides: Partial<Parameters<typeof makeClaim>[0]>) {
  return makeClaim(overrides, crypto.randomUUID());
}

beforeEach(() => {
  claims.set([]);
  claimFilter.set(new Set());
  categoryFilter.set(new Set());
  minConfidence.set(0);
});

describe("filteredClaims", () => {
  it("passes everything through with empty filters", () => {
    claims.set([
      claim({ status: "verified", category: "science", confidence: 8 }),
      claim({ status: "false", category: "sport", confidence: 3 })
    ]);
    expect(get(filteredClaims)).toHaveLength(2);
  });

  it("filters by a single status", () => {
    claims.set([claim({ status: "verified" }), claim({ status: "false" })]);
    toggleStatusFilter("false");
    expect(get(filteredClaims)).toHaveLength(1);
    expect(get(filteredClaims)[0].status).toBe("false");
  });

  it("filters by multiple statuses (OR)", () => {
    claims.set([
      claim({ status: "verified" }),
      claim({ status: "false" }),
      claim({ status: "pending" })
    ]);
    toggleStatusFilter("verified");
    toggleStatusFilter("false");
    expect(get(filteredClaims)).toHaveLength(2);
  });

  it("toggling a selected status off removes it from the filter", () => {
    claims.set([claim({ status: "verified" }), claim({ status: "false" })]);
    toggleStatusFilter("verified");
    toggleStatusFilter("verified");
    expect(get(filteredClaims)).toHaveLength(2);
  });

  it("filters by a single category", () => {
    claims.set([claim({ category: "science" }), claim({ category: "sport" })]);
    toggleCategoryFilter("sport");
    expect(get(filteredClaims)).toHaveLength(1);
    expect(get(filteredClaims)[0].category).toBe("sport");
  });

  it("filters by multiple categories (OR)", () => {
    claims.set([
      claim({ category: "science" }),
      claim({ category: "sport" }),
      claim({ category: "société" })
    ]);
    toggleCategoryFilter("science");
    toggleCategoryFilter("sport");
    expect(get(filteredClaims)).toHaveLength(2);
  });

  it("filters by minimum confidence", () => {
    claims.set([claim({ confidence: 9 }), claim({ confidence: 4 })]);
    minConfidence.set(7);
    expect(get(filteredClaims)).toHaveLength(1);
    expect(get(filteredClaims)[0].confidence).toBe(9);
  });

  it("combines status, category and confidence filters", () => {
    claims.set([
      claim({ status: "verified", category: "science", confidence: 9 }),
      claim({ status: "verified", category: "science", confidence: 2 }),
      claim({ status: "verified", category: "sport", confidence: 9 }),
      claim({ status: "false", category: "science", confidence: 9 })
    ]);
    toggleStatusFilter("verified");
    toggleCategoryFilter("science");
    minConfidence.set(5);
    expect(get(filteredClaims)).toHaveLength(1);
  });
});
