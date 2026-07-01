import type { VerificationStatus } from "$lib/stores/claims";

// Single source of truth for the visual identity of a verification status:
// its colour, emoji icon, the long label shown on cards/badges, and the short
// label used by the filter pills. Everything status-related derives from here,
// so colour/icon/label can never drift out of sync across the layouts.
interface StatusMeta {
  color: string;
  icon: string;
  label: string;
  filterLabel: string;
}

export const STATUS_META: Record<VerificationStatus, StatusMeta> = {
  verified: {
    color: "#10b981",
    icon: "✅",
    label: "Vérifié",
    filterLabel: "Vrais"
  },
  false: { color: "#ef4444", icon: "❌", label: "Faux", filterLabel: "Faux" },
  pending: {
    color: "#f59e0b",
    icon: "⏳",
    label: "Analyse en cours...",
    filterLabel: "En cours"
  },
  uncertain: {
    color: "#6b7280",
    icon: "❓",
    label: "Incertain",
    filterLabel: "Incertains"
  },
  unverifiable: {
    color: "#8b5cf6",
    icon: "🔍",
    label: "Non vérifiable",
    filterLabel: "Invérifiables"
  }
};

// Display order for stat rows, filter bars and stat cards.
export const STATUS_ORDER: VerificationStatus[] = [
  "verified",
  "false",
  "pending",
  "uncertain",
  "unverifiable"
];

// Filter-bar entries: one per status, in order — used by the status multiselect filter.
export const CLAIM_FILTERS: {
  key: VerificationStatus;
  label: string;
  icon: string;
}[] = STATUS_ORDER.map((s) => ({
  key: s,
  label: STATUS_META[s].filterLabel,
  icon: STATUS_META[s].icon
}));

// Flat lookups derived from STATUS_META for ergonomic use in templates. Typed by
// VerificationStatus so indexing with a claim's status is exhaustive — no fallback needed.
function mapMeta<T>(pick: (m: StatusMeta) => T): Record<VerificationStatus, T> {
  return Object.fromEntries(
    STATUS_ORDER.map((s) => [s, pick(STATUS_META[s])])
  ) as Record<VerificationStatus, T>;
}

export const STATUS_COLOR = mapMeta((m) => m.color);
export const STATUS_ICON = mapMeta((m) => m.icon);
export const STATUS_LABEL = mapMeta((m) => m.label);
