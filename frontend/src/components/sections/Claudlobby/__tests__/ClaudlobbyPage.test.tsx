import { describe, it, expect, vi } from "vitest";
import site from "virtual:site-config";
import {
  renderWithProviders,
  screen,
  userEvent,
  within,
} from "../../../../test/utils";
import { ClaudlobbyPage } from "../ClaudlobbyPage";
import { claudlobby } from "../../../../content/claudlobby";
import {
  CLAUDLOBBY_GETTING_STARTED,
  CLAUDLOBBY_README_QUICKSTART,
  CLAUDLOBBY_REPO,
} from "../../../../content/links";
import { track } from "../../../../services/analytics";

vi.mock("../../../../services/analytics", () => ({ track: vi.fn() }));

const { hero, maturity, quickstart, roadmap } = claudlobby;

describe("ClaudlobbyPage", () => {
  it("leads with one heading and both next steps", () => {
    renderWithProviders(<ClaudlobbyPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: hero.ctaStar })).toHaveAttribute(
      "href",
      CLAUDLOBBY_REPO,
    );
    expect(
      screen.getByRole("link", { name: hero.ctaQuickstart }),
    ).toHaveAttribute("href", "#quickstart");
  });

  it("is Claudlobby's alone: nothing of the owner's, who the site around it is", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage />);
    const heroText = container.querySelector(".page-hero")!.textContent!;
    expect(heroText).not.toContain(site.owner.name);
    // No link out to the owner's page: the breadcrumbs and the header are the
    // site's, and lead there.
    expect(
      screen.queryAllByRole("link").filter((link) => link.getAttribute("href") === "/"),
    ).toEqual([]);
  });

  it("reports a Quickstart click once", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClaudlobbyPage />);

    await user.click(screen.getByRole("link", { name: hero.ctaQuickstart }));

    expect(track).toHaveBeenCalledExactlyOnceWith({ name: "quickstart_click" });
  });

  it("states its maturity with the CTAs and points at the roadmap", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage />);
    const note = container.querySelector<HTMLElement>(".page-hero .cl-maturity")!;
    expect(note).toHaveTextContent(maturity.label);
    expect(
      within(note).getByRole("link", { name: maturity.link }),
    ).toHaveAttribute("href", "#roadmap");
  });

  it("points every in-page link at a section on the page", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage />);
    const anchors = [...container.querySelectorAll('a[href^="#"]')];
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      const id = anchor.getAttribute("href")!.slice(1);
      expect(document.getElementById(id), anchor.textContent!).not.toBeNull();
    }
  });

  it("keeps today and next in separate lists", () => {
    renderWithProviders(<ClaudlobbyPage />);
    for (const column of [roadmap.today, roadmap.next]) {
      const card = screen.getByRole("heading", { name: column.heading })
        .parentElement!;
      expect(within(card).getAllByRole("listitem")).toHaveLength(
        column.items.length,
      );
    }
  });

  it("never skips a heading level", () => {
    renderWithProviders(<ClaudlobbyPage />);
    const levels = screen
      .getAllByRole("heading")
      .map((heading) => Number(heading.tagName.slice(1)));
    levels.forEach((level, index) => {
      if (index > 0) expect(level).toBeLessThanOrEqual(levels[index - 1] + 1);
    });
  });

  it("renders backticked terms in the copy as code", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage />);
    expect(container.querySelector(".page-sub code")?.textContent).toBe(
      "fleet.yaml",
    );
  });

  it("sends the quickstart to the README's own steps", () => {
    renderWithProviders(<ClaudlobbyPage />);
    expect(
      screen.getByRole("link", { name: quickstart.readmeLink }),
    ).toHaveAttribute("href", CLAUDLOBBY_README_QUICKSTART);
    expect(
      screen.getByRole("link", { name: quickstart.docsLink }),
    ).toHaveAttribute("href", CLAUDLOBBY_GETTING_STARTED);
  });
});
