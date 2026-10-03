import { afterEach, describe, it, expect, vi } from "vitest";
import { renderWithProviders, screen } from "../../../../test/utils";
import { SourceNote } from "../SourceNote";

const FROM = {
  source: "https://github.com/Claudfather/Claudlobby/blob/69f2fa0afe7b44da846593a42543548d0ff74fc3/README.md",
  sourceLabel: "Claudlobby README",
  asOf: "2026-10-02",
};

describe("SourceNote", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("follows its lead with the source, opened in a new tab", () => {
    renderWithProviders(<SourceNote lead="Source:" from={FROM} />);
    const link = screen.getByRole("link", { name: FROM.sourceLabel });
    expect(link).toHaveAttribute("href", FROM.source);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link.parentElement).toHaveTextContent(/^Source: Claudlobby README, as of /);
  });

  // Read as midnight UTC but shown in local time, the day slips back west of
  // UTC; read as local midnight but shown in UTC, it slips back east. CI runs
  // in UTC, where neither shows, so the test sets the zone itself.
  it.each(["America/Los_Angeles", "Asia/Tokyo"])("gives the day its date names, in %s", (zone) => {
    vi.stubEnv("TZ", zone);
    const { container } = renderWithProviders(<SourceNote lead="Source:" from={FROM} />);
    expect(container).toHaveTextContent("as of Oct 2, 2026.");
  });
});
