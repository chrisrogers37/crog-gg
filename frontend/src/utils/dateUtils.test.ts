import { describe, it, expect } from "vitest";
import { parseDateToNumber } from "./dateUtils";

describe("parseDateToNumber", () => {
  it('returns 999912 for "present"', () => {
    expect(parseDateToNumber("present")).toBe(999912);
  });

  it('parses "Mon YYYY" format correctly', () => {
    expect(parseDateToNumber("Nov 2025")).toBe(202511);
    expect(parseDateToNumber("Feb 2023")).toBe(202302);
    expect(parseDateToNumber("Jan 2020")).toBe(202001);
    expect(parseDateToNumber("Dec 2021")).toBe(202112);
  });

  it("parses year-only format as December of that year", () => {
    expect(parseDateToNumber("2023")).toBe(202312);
    expect(parseDateToNumber("2010")).toBe(201012);
  });

  it("sorts dates in correct chronological order", () => {
    const dates = [
      "Oct 2018",
      "present",
      "Feb 2023",
      "Nov 2025",
      "2014",
      "Jul 2025",
      "Dec 2021",
    ];
    const sorted = [...dates].sort(
      (a, b) => parseDateToNumber(a) - parseDateToNumber(b),
    );
    expect(sorted).toEqual([
      "2014",
      "Oct 2018",
      "Dec 2021",
      "Feb 2023",
      "Jul 2025",
      "Nov 2025",
      "present",
    ]);
  });

  it("handles all 12 months", () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const parsed = months.map((m) => parseDateToNumber(`${m} 2024`));
    // Should be monotonically increasing
    for (let i = 1; i < parsed.length; i++) {
      expect(parsed[i]).toBeGreaterThan(parsed[i - 1]);
    }
  });
});
