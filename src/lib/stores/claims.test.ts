import { get } from "svelte/store";
import { beforeEach, describe, expect, it } from "vitest";
import {
  addOrUpdateClaim,
  categoryFilter,
  claimFilter,
  claims,
  claimStats,
  filteredClaims,
  makeClaim,
  minConfidence,
  removeClaim,
  sortedClaims,
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

describe("addOrUpdateClaim", () => {
  it("appends a claim with a new id", () => {
    addOrUpdateClaim(makeClaim({ text: "first" }, "a"));
    addOrUpdateClaim(makeClaim({ text: "second" }, "b"));

    const current = get(claims);
    expect(current).toHaveLength(2);
    expect(current.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("replaces the existing claim when the id already exists", () => {
    addOrUpdateClaim(makeClaim({ text: "pending", status: "pending" }, "a"));
    addOrUpdateClaim(makeClaim({ text: "verified", status: "verified" }, "a"));

    const current = get(claims);
    expect(current).toHaveLength(1);
    expect(current[0].status).toBe("verified");
    expect(current[0].text).toBe("verified");
  });

  it("replaces in place without reordering the list", () => {
    addOrUpdateClaim(makeClaim({}, "a"));
    addOrUpdateClaim(makeClaim({}, "b"));
    addOrUpdateClaim(makeClaim({ status: "false" }, "a"));

    const current = get(claims);
    expect(current.map((c) => c.id)).toEqual(["a", "b"]);
    expect(current[0].status).toBe("false");
  });
});

describe("removeClaim", () => {
  it("removes the claim matching the id", () => {
    claims.set([makeClaim({}, "a"), makeClaim({}, "b")]);
    removeClaim("a");

    const current = get(claims);
    expect(current).toHaveLength(1);
    expect(current[0].id).toBe("b");
  });

  it("is a no-op when the id is unknown", () => {
    claims.set([makeClaim({}, "a")]);
    removeClaim("missing");
    expect(get(claims)).toHaveLength(1);
  });
});

describe("sortedClaims", () => {
  it("returns claims in reverse insertion order (newest first)", () => {
    claims.set([makeClaim({}, "a"), makeClaim({}, "b"), makeClaim({}, "c")]);
    expect(get(sortedClaims).map((c) => c.id)).toEqual(["c", "b", "a"]);
  });

  it("does not mutate the source claims array", () => {
    claims.set([makeClaim({}, "a"), makeClaim({}, "b")]);
    get(sortedClaims);
    expect(get(claims).map((c) => c.id)).toEqual(["a", "b"]);
  });
});

describe("claimStats", () => {
  it("counts totals and each status", () => {
    claims.set([
      claim({ status: "verified" }),
      claim({ status: "verified" }),
      claim({ status: "false" }),
      claim({ status: "pending" }),
      claim({ status: "uncertain" }),
      claim({ status: "unverifiable" })
    ]);

    expect(get(claimStats)).toEqual({
      total: 6,
      verified: 2,
      false: 1,
      pending: 1,
      uncertain: 1,
      unverifiable: 1
    });
  });

  it("is all zeros for an empty list", () => {
    expect(get(claimStats)).toEqual({
      total: 0,
      verified: 0,
      false: 0,
      pending: 0,
      uncertain: 0,
      unverifiable: 0
    });
  });
});
