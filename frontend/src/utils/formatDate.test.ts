import { afterEach, describe, expect, it } from "vitest";
import { formatDay, formatMonth } from "./formatDate";

const zone = process.env.TZ;
afterEach(() => {
  process.env.TZ = zone;
});

describe("formatDate", () => {
  // A snapshot's date is a calendar day, so it must read the same wherever
  // the page is opened, not shift to the day before west of UTC.
  it.each(["Pacific/Kiritimati", "UTC", "Pacific/Pago_Pago"])(
    "reads the same in %s",
    (timeZone) => {
      process.env.TZ = timeZone;
      expect(formatDay("2026-09-29")).toBe("Sep 29, 2026");
      expect(formatMonth("2026-01-01")).toBe("Jan 2026");
    },
  );
});
