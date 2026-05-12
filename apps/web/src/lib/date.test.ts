import { describe, expect, it } from "vitest";
import { formatDateId } from "./date";

describe("formatDateId", () => {
  it("formats ISO dates with numeric Indonesian order by default", () => {
    expect(formatDateId("2026-05-11T15:30:00.000Z")).toBe("11/5/2026");
  });

  it("formats short and long Indonesian month names", () => {
    expect(formatDateId("2026-01-03", "short")).toBe("3 Jan 2026");
    expect(formatDateId("2026-12-25", "long")).toBe("25 Desember 2026");
  });

  it("clamps invalid month values to the nearest available month label", () => {
    expect(formatDateId("2026-00-09", "long")).toBe("9 Januari 2026");
    expect(formatDateId("2026-99-09", "short")).toBe("9 Des 2026");
  });
});
