import { describe, it, expect, vi } from "vitest";
import site from "virtual:site-config";
import {
  renderWithProviders,
  screen,
  userEvent,
  within,
} from "../../../../test/utils";
import { makeProject } from "../../../../test/builders";
import { ClaudlobbyPage } from "../ClaudlobbyPage";
import { claudlobby } from "../../../../content/claudlobby";
import { strings } from "../../../../test/claudlobbyRules";
import { photoSrc, photoSrcSet } from "../../../../utils/photos";
import {
  CLAUDLOBBY_GETTING_STARTED,
  CLAUDLOBBY_README_QUICKSTART,
  CLAUDLOBBY_REPO,
} from "../../../../content/links";
import { track } from "../../../../services/analytics";

vi.mock("../../../../services/analytics", () => ({ track: vi.fn() }));

const { hero, maturity, quickstart, roadmap, workers } = claudlobby;

const CLAUDLOBBY = makeProject({ id: "claudlobby", title: "Claudlobby", featured: true });

describe("ClaudlobbyPage", () => {
  it("wears Claudfather's look: the page's scope, and its mark in the hero", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    // .cl-page carries the colours its sections read (Claudlobby.css).
    expect(container.firstElementChild).toHaveClass("cl-page");
    const mark = screen.getByRole("img", { name: claudlobby.mark.alt });
    expect(mark.closest(".cl-hero")).not.toBeNull();
    expect(mark).toHaveAttribute("src", photoSrc(claudlobby.mark.photo));
    expect(mark).toHaveAttribute("srcset", photoSrcSet(claudlobby.mark.photo));
    // Read after the words: the last thing in the hero.
    expect(mark.parentElement!.lastElementChild).toBe(mark);
  });

  it("leads with one heading and both next steps", () => {
    renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("link", { name: hero.ctaStar })).toHaveAttribute(
      "href",
      CLAUDLOBBY_REPO,
    );
    expect(
      screen.getByRole("link", { name: hero.ctaQuickstart }),
    ).toHaveAttribute("href", "#quickstart");
  });

  it("names the project, and says it's featured only when index.yaml does", () => {
    const { container, unmount } = renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    expect(container.querySelector(".page-eyebrow")).toHaveTextContent("Claudlobby · Featured project");
    unmount();
    const plain = renderWithProviders(
      <ClaudlobbyPage project={{ ...CLAUDLOBBY, featured: false }} />,
    ).container;
    expect(plain.querySelector(".page-eyebrow")).toHaveTextContent(/^Claudlobby$/);
  });

  it("is Claudlobby's alone: nothing of the owner's, who the site around it is", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    const heroText = container.querySelector(".page-hero")!.textContent!;
    expect(heroText).not.toContain(site.owner.name);
    // No link out to the owner's page: the breadcrumbs and the header are the
    // site's, and lead there.
    expect(
      screen.queryAllByRole("link").filter((link) => link.getAttribute("href") === "/"),
    ).toEqual([]);
  });

  it("follows the hero with the roles a fleet fills", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    // Who it's for comes first (Chris, 2026-10-02): the jobs, then how it works.
    const section = container.querySelector(".page-hero")!.nextElementSibling as HTMLElement;
    expect(section).toHaveAttribute("id", "workers");
    expect(
      within(section)
        .getAllByRole("listitem")
        .map((role) => within(role).getByRole("heading", { level: 3 }).textContent),
    ).toEqual(workers.roles.map((role) => role.title));
  });

  it("cites the repo beside what it took from it: the roles, and the library's counts", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    for (const [id, from] of [
      ["workers", workers],
      ["why", claudlobby.why.library],
    ] as const) {
      const section = container.querySelector<HTMLElement>(`#${id}`)!;
      expect(within(section).getByRole("link", { name: from.sourceLabel }), id).toHaveAttribute(
        "href",
        from.source,
      );
    }
  });

  it("reports a Quickstart click once", async () => {
    const user = userEvent.setup();
    renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);

    await user.click(screen.getByRole("link", { name: hero.ctaQuickstart }));

    expect(track).toHaveBeenCalledExactlyOnceWith({ name: "quickstart_click" });
  });

  it("states its maturity with the CTAs and points at the roadmap", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    const note = container.querySelector<HTMLElement>(".page-hero .cl-maturity")!;
    expect(note).toHaveTextContent(maturity.label);
    expect(
      within(note).getByRole("link", { name: maturity.link }),
    ).toHaveAttribute("href", "#roadmap");
  });

  it("points every in-page link at a section on the page", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    const anchors = [...container.querySelectorAll('a[href^="#"]')];
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      const id = anchor.getAttribute("href")!.slice(1);
      expect(document.getElementById(id), anchor.textContent!).not.toBeNull();
    }
  });

  it("keeps today and next in separate lists", () => {
    renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    for (const column of [roadmap.today, roadmap.next]) {
      const card = screen.getByRole("heading", { name: column.heading })
        .parentElement!;
      expect(within(card).getAllByRole("listitem")).toHaveLength(
        column.items.length,
      );
    }
  });

  it("never skips a heading level", () => {
    renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    const levels = screen
      .getAllByRole("heading")
      .map((heading) => Number(heading.tagName.slice(1)));
    levels.forEach((level, index) => {
      if (index > 0) expect(level).toBeLessThanOrEqual(levels[index - 1] + 1);
    });
  });

  it("renders every backticked term in the copy as code, and no backtick", () => {
    const { container } = renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    const terms = strings(claudlobby).flatMap((text) =>
      [...text.matchAll(/`([^`]+)`/g)].map((match) => match[1]),
    );
    expect(terms.length).toBeGreaterThan(0);
    const code = [...container.querySelectorAll("code")].map((element) => element.textContent);
    for (const term of terms) expect(code, term).toContain(term);
    expect(container.textContent).not.toContain("`");
  });

  it("sends the quickstart to the README's own steps", () => {
    renderWithProviders(<ClaudlobbyPage project={CLAUDLOBBY} />);
    expect(
      screen.getByRole("link", { name: quickstart.readmeLink }),
    ).toHaveAttribute("href", CLAUDLOBBY_README_QUICKSTART);
    expect(
      screen.getByRole("link", { name: quickstart.docsLink }),
    ).toHaveAttribute("href", CLAUDLOBBY_GETTING_STARTED);
  });
});
