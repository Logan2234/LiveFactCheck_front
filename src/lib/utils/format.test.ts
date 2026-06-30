import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  formatCost,
  formatDate,
  formatDateTime,
  formatDuration,
  formatPercent,
  formatTime,
  formatUptime
} from "$lib/utils/format";

// Built from components (not an ISO string) so the local timezone can't shift
// the day — toLocaleString renders in local time.
const SAMPLE = new Date(2024, 11, 31, 14, 5, 9); // 31 Dec 2024, 14:05:09 local

describe("formatDate", () => {
  it("renders day/month/year in the default fr-FR locale", () => {
    expect(formatDate(SAMPLE)).toBe("31/12/2024");
  });

  it("honours an explicit locale", () => {
    expect(formatDate(SAMPLE, { locale: "en-US" })).toBe("12/31/2024");
  });

  it("accepts a timestamp", () => {
    expect(formatDate(SAMPLE.getTime())).toBe("31/12/2024");
  });
});

describe("formatTime", () => {
  it("includes seconds by default", () => {
    expect(formatTime(SAMPLE)).toBe("14:05:09");
  });

  it("omits seconds when withSeconds is false", () => {
    expect(formatTime(SAMPLE, { withSeconds: false })).toBe("14:05");
  });
});

describe("formatDateTime", () => {
  it("combines date and time with seconds by default", () => {
    const out = formatDateTime(SAMPLE);
    expect(out).toContain("31/12/2024");
    expect(out).toContain("14:05:09");
  });

  it("drops seconds when withSeconds is false", () => {
    const out = formatDateTime(SAMPLE, { withSeconds: false });
    expect(out).toContain("14:05");
    expect(out).not.toContain(":09");
  });
});

describe("formatDuration", () => {
  const NOW_MS = 1_700_000_000_000;
  const nowS = NOW_MS / 1000;

  beforeEach(() => {
    vi.spyOn(Date, "now").mockReturnValue(NOW_MS);
  });

  it("shows seconds only under a minute", () => {
    expect(formatDuration(nowS - 30)).toBe("30 s");
  });

  it("shows minutes and seconds under an hour", () => {
    expect(formatDuration(nowS - 90)).toBe("1 min 30 s");
  });

  it("shows hours and minutes past an hour", () => {
    expect(formatDuration(nowS - 3661)).toBe("1 h 1 min");
  });
});

describe("formatUptime", () => {
  it("shows seconds only under a minute", () => {
    expect(formatUptime(42)).toBe("42s");
  });

  it("adds minutes once past 60 s", () => {
    expect(formatUptime(90)).toBe("1m 30s");
  });

  it("adds hours once past an hour", () => {
    expect(formatUptime(3661)).toBe("1h 1m 1s");
  });
});

describe("formatCost", () => {
  it("renders an em dash for a null cost", () => {
    expect(formatCost(null)).toBe("—");
  });

  it("defaults to four decimals", () => {
    expect(formatCost(0.1)).toBe("$0.1000");
  });

  it("formats a cost with the requested precision", () => {
    expect(formatCost(0.12345, 2)).toBe("$0.12");
  });
});

describe("formatPercent", () => {
  it("scales a ratio to a percentage", () => {
    expect(formatPercent(0.5)).toBe("50 %");
  });

  it("honours the requested precision", () => {
    expect(formatPercent(0.1234, 1)).toBe("12.3 %");
  });
});
