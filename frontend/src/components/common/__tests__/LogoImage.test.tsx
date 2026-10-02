import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import yaml from "js-yaml";
import { LogoImage } from "../LogoImage";
import { logoUrl } from "../../../utils/logos";
import type { TimelineData } from "../../../types/Timeline";
import timelineYaml from "@site/public/content/timeline.yaml?raw";
import { inSite } from "../../../test/site";

const logoFiles = import.meta.glob("@site/public/logos/*.png", {
  query: "?url",
  eager: true,
});

describe("LogoImage", () => {
  it("renders the domain's self-hosted logo at its size", () => {
    render(<LogoImage domain="meta.com" alt="Meta" size={28} />);
    const img = screen.getByRole("img", { name: "Meta" });
    expect(img).toHaveAttribute("src", logoUrl("meta.com"));
    expect(img).toHaveAttribute("width", "28");
    expect(img).toHaveAttribute("height", "28");
  });

  it("shows the fallback when there is no domain", () => {
    render(<LogoImage domain={undefined} alt="" fallback={<span>fb</span>} />);
    expect(screen.getByText("fb")).toBeInTheDocument();
  });

  it("swaps to the fallback when the logo fails to load", () => {
    render(
      <LogoImage domain="example.org" alt="Example" fallback={<span>fb</span>} />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Example" }));
    expect(screen.getByText("fb")).toBeInTheDocument();
  });

  it("has a logo for every organisation on the timeline", () => {
    // A new timeline entry with a new domain would show a placeholder until
    // its logo is added to site/public/logos/, so the gap is caught here instead.
    const { entries } = yaml.load(timelineYaml) as TimelineData;
    const domains = new Set(entries.flatMap((entry) => entry.domain ?? []));
    expect(domains.size).toBeGreaterThan(0);
    for (const domain of domains) {
      expect(
        inSite(logoFiles, `/public${logoUrl(domain)}`),
        `public${logoUrl(domain)}`,
      ).toBeDefined();
    }
  });
});
