export const CATEGORY_COLORS: Record<string, string> = {
  politique: "#3b82f6",
  économie: "#f59e0b",
  science: "#06b6d4",
  santé: "#10b981",
  histoire: "#8b5cf6",
  sport: "#f97316",
  société: "#ec4899",
  technologie: "#6366f1",
  autre: "#6b7280"
};

// Fixed display order for category filter pills — the full set, regardless
// of which categories the current claims actually use.
export const CATEGORIES = Object.keys(CATEGORY_COLORS);
