import { afterEach, describe, expect, it, vi } from "vitest";
import { screen, within, fireEvent } from "@testing-library/react";
import { renderWithProviders } from "../../../../test/utils";
import { makeProject } from "../../../../test/builders";
import {
  claudfather,
  type WebsiteDestination,
} from "../../../../content/claudfather";
import { CLAUDLOBBY_GETTING_STARTED } from "../../../../content/links";
import { track } from "../../../../services/analytics";
import { ClaudfatherPage } from "../ClaudfatherPage";

vi.mock("../../../../services/analytics", () => ({ track: vi.fn() }));
const project = makeProject({
  id: "claudfather",
  title: "Claudfather",
  featured: true,
});
const website = claudfather.website;
afterEach(() => {
  claudfather.website = website;
});

describe("Claudfather page", () => {
  it("names the project and explains the workflow before the family", () => {
    const { container } = renderWithProviders(
      <ClaudfatherPage project={project} />,
    );
    expect(container.querySelector(".page-eyebrow")).toHaveTextContent(
      "Claudfather · Featured project",
    );
    expect(
      container.querySelector(".page-hero")?.nextElementSibling,
    ).toHaveAttribute("id", "how-it-works");
    expect(
      within(document.getElementById("how-it-works")!).getAllByRole("listitem"),
    ).toHaveLength(3);
    expect(screen.getByText(claudfather.workflow.label)).toBeVisible();
    expect(screen.getByText(claudfather.workflow.caveat)).toBeVisible();
    expect(container.querySelector(".stats-grid, .cl-counts")).toBeNull();
  });

  it("keeps current and legacy anchors, without skipped heading levels", () => {
    const { container } = renderWithProviders(
      <ClaudfatherPage project={project} />,
    );
    for (const id of [
      "how-it-works",
      "quickstart",
      "updates",
      "roadmap",
      "claudlobby",
    ]) {
      expect(document.getElementById(id)).not.toBeNull();
    }
    for (const link of container.querySelectorAll('a[href^="#"]')) {
      expect(
        document.getElementById(link.getAttribute("href")!.slice(1)),
      ).not.toBeNull();
    }
    const levels = screen
      .getAllByRole("heading")
      .map((h) => Number(h.tagName.slice(1)));
    levels
      .slice(1)
      .forEach((level, i) => expect(level).toBeLessThanOrEqual(levels[i] + 1));
  });

  it("offers sources for public components and no link for private evaluation tooling", () => {
    renderWithProviders(<ClaudfatherPage project={project} />);
    for (const role of claudfather.family) {
      const row = document.getElementById(role.id)!;
      expect(within(row).getByRole("heading")).toHaveTextContent(role.job);
      if (role.repo)
        expect(within(row).getByRole("link")).toHaveAttribute(
          "href",
          role.repo,
        );
      else expect(within(row).queryByRole("link")).toBeNull();
    }
    expect(
      screen.getByRole("link", { name: /public brand reference/i }),
    ).toHaveAttribute("href", claudfather.family[0].source);
    expect(
      screen.getByRole("link", { name: claudfather.start.setupLabel }),
    ).toHaveAttribute("href", CLAUDLOBBY_GETTING_STARTED);
  });

  it.each<WebsiteDestination | null>([
    website,
    {
      state: "live",
      url: "https://product.example",
      label: "Visit product",
      caveat: "Some features remain in alpha.",
    },
    null,
  ])(
    "uses the same authored destination and caveat everywhere: %j",
    (destination) => {
      claudfather.website = destination;
      const { container } = renderWithProviders(
        <ClaudfatherPage project={project} />,
      );
      if (destination) {
        const links = screen.getAllByRole("link", { name: destination.label });
        expect(links).toHaveLength(2);
        for (const link of links) {
          expect(link).toHaveAttribute("href", destination.url);
          expect(link.parentElement).toHaveTextContent(destination.caveat);
          fireEvent.click(link);
        }
      } else {
        expect(container.querySelector(".cf-website")).toBeNull();
        expect(
          screen.getByRole("link", { name: claudfather.start.setupLabel }),
        ).toBeVisible();
      }
      fireEvent.click(screen.getByRole("link", { name: claudfather.hero.cta }));
      fireEvent.click(
        screen.getByRole("link", { name: /View source organization/ }),
      );
      expect(track).not.toHaveBeenCalled();
    },
  );
});
