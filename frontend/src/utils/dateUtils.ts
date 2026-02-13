/**
 * Parse date strings like "Nov 2025", "2023", or "present" into a sortable number (YYYYMM).
 * Used by the Timeline to sort entries chronologically.
 */
export function parseDateToNumber(dateStr: string): number {
  if (dateStr === "present") return 999912;
  const months: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };
  const parts = dateStr.split(" ");
  if (parts.length === 2 && months[parts[0]]) {
    return Number(parts[1] + months[parts[0]]);
  }
  // Year-only format like "2023" - treat as December of that year
  return Number(parts[0] + "12");
}
