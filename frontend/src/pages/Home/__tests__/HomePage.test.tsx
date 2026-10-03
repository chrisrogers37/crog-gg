import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import site from "virtual:site-config";
import { useContentStore, useUIStore } from "../../../store";
import { makeBio, makeProject } from "../../../test/builders";
import {
  act,
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
  within,
} from "../../../test/utils";
import { HomePage } from "../HomePage";

// Restored after each test, so a stubbed action can't leak into the next.
const INITIAL = useContentStore.getState();
const INITIAL_UI = useUIStore.getState();

const BIO = makeBio({
  display_name: "Ada Example",
  tagline: "i build small things.\nand some bigger ones.",
  about_text: "first paragraph.\n\nsecond paragraph.",
});

/** The page with its bio in, and the other files as the test says. */
const loaded = (loads: Partial<typeof INITIAL.loads> = {}) => {
  useContentStore.setState({
    bio: BIO,
    loads: { ...INITIAL.loads, bio: "ready", ...loads },
  });
  return renderWithProviders(<HomePage />, { initialRoute: "/" });
};

afterEach(() => {
  useContentStore.setState(INITIAL, true);
  useUIStore.setState(INITIAL_UI, true);
  // Helmet never clears the title, so a test reading it starts from none.
  document.title = "";
});

describe("HomePage before its content arrives", () => {
  it("says a failed load failed, naming the file, and Retry reloads the content rather than the page", () => {
    const loadContent = vi.fn();
    useContentStore.setState({
      loads: { ...INITIAL.loads, bio: { error: "content/bio.yaml answered 404" } },
      loadContent,
    });
    renderWithProviders(<HomePage />, { initialRoute: "/" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "this page didn't load: content/bio.yaml answered 404.",
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(loadContent).toHaveBeenCalled();
  });

  it("holds the hero's place, and titles the tab, while it loads", async () => {
    useContentStore.setState({ loads: { ...INITIAL.loads, bio: "loading" } });
    renderWithProviders(<HomePage />, { initialRoute: "/" });

    expect(screen.getByRole("status", { name: "Loading" })).toBeInTheDocument();
    await waitFor(() => expect(document.title).toBe(site.seo.site_name));
  });
});

describe("HomePage", () => {
  beforeEach(() => {
    useUIStore.setState({ features: { regenerate: true, github: true } });
  });

  it("leads with the owner: their name, the tagline as the one h1, and two next steps", () => {
    loaded();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "i build small things.",
    );
    expect(screen.getByText("and some bigger ones.")).toBeInTheDocument();
    expect(screen.getAllByText("Ada Example").length).toBeGreaterThan(0);
    expect(screen.getByRole("img", { name: "Ada Example's profile photo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "projects" })).toHaveAttribute("href", "/projects");
    expect(screen.getByRole("link", { name: "connect" })).toHaveAttribute("href", "#contact");
  });

  it("titles itself with the owner's name when there's no tagline", () => {
    useContentStore.setState({
      bio: { ...BIO, tagline: undefined },
      loads: { ...INITIAL.loads, bio: "ready" },
    });
    renderWithProviders(<HomePage />, { initialRoute: "/" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Ada Example");
  });

  it("shows site.yaml's sections in its order, then contact, each headed by its label", () => {
    loaded();
    const sections = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
    expect(sections).toEqual([
      ...site.sections.map((section) => section.label),
      site.contact.heading,
    ]);
    for (const { id } of site.sections) {
      expect(document.getElementById(id)).toBeInTheDocument();
    }
  });

  it("renders only the sections site.yaml lists, in its order", () => {
    const original = site.sections;
    // The last and the first, the other way round.
    site.sections = [original[original.length - 1], original[0]];
    try {
      loaded();
      const headings = screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent);
      expect(headings).toEqual([...site.sections.map((s) => s.label), site.contact.heading]);
      for (const { id } of original.slice(1, -1)) {
        expect(document.getElementById(id), id).toBeNull();
      }
    } finally {
      site.sections = original;
    }
  });

  it("shows the featured project, the next three and a link to them all", () => {
    useContentStore.setState({
      projects: ["one", "two", "three", "four", "five"].map((id) =>
        makeProject({ id, title: id, featured: id === "three" }),
      ),
    });
    loaded({ projects: "ready" });

    const section = document.getElementById("projects")!;
    expect(within(section).getByRole("article", { name: /three/ })).toBeInTheDocument();
    const cards = [...section.querySelectorAll("a.project-card")].map((card) =>
      card.getAttribute("href"),
    );
    expect(cards).toEqual(["/projects/one", "/projects/two", "/projects/four"]);
    expect(within(section).getByRole("link", { name: "all projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
  });

  it("waits for every file above a linked section, the photo strip's too, before it scrolls", () => {
    window.history.replaceState(null, "", "/#contact");
    const scrollIntoView = vi.mocked(Element.prototype.scrollIntoView);
    scrollIntoView.mockClear();
    try {
      // Everything in but showcase.yaml, whose strip sits above the contact section.
      loaded({ timeline: "ready", projects: "ready" });
      expect(scrollIntoView).not.toHaveBeenCalled();

      act(() => useContentStore.setState({ showcase: [] }));
      expect(scrollIntoView).toHaveBeenCalledTimes(1);
      expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("contact"));
    } finally {
      window.history.replaceState(null, "", "/");
    }
  });

  it("points every in-page link at a section on the page", () => {
    const { container } = loaded();
    const anchors = [...container.querySelectorAll('a[href^="#"]')];
    expect(anchors.length).toBeGreaterThan(0);
    for (const anchor of anchors) {
      const id = anchor.getAttribute("href")!.slice(1);
      expect(document.getElementById(id), anchor.textContent!).not.toBeNull();
    }
  });

  it("sets the About text a paragraph per block", () => {
    loaded();
    const about = within(document.getElementById("about")!);
    expect(about.getByText("first paragraph.").tagName).toBe("P");
    expect(about.getByText("second paragraph.").tagName).toBe("P");
  });

  it("puts SUMMON under the About text where the deployment serves it", () => {
    loaded();
    const about = within(document.getElementById("about")!);
    expect(about.getByRole("button", { name: site.regenerate.labels.button })).toBeInTheDocument();
  });

  it("hides SUMMON where the deployment can't serve it (#189 M21)", () => {
    useUIStore.setState({ features: { regenerate: false, github: true } });
    loaded();
    expect(
      screen.queryByRole("button", { name: site.regenerate.labels.button }),
    ).not.toBeInTheDocument();
  });

  it("keeps a failed journey to its own section, with the rest of the page up (#190 M23)", () => {
    const reloadTimeline = vi.fn();
    useContentStore.setState({ reloadTimeline });
    loaded({ timeline: { error: "content/timeline.yaml has 1 problem(s)" } });

    const journey = within(document.getElementById("journey")!);
    expect(journey.getByRole("alert")).toHaveTextContent(
      "the journey didn't load: content/timeline.yaml has 1 problem(s).",
    );
    fireEvent.click(journey.getByRole("button", { name: /retry/i }));
    expect(reloadTimeline).toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("never skips a heading level", () => {
    loaded();
    const levels = screen
      .getAllByRole("heading")
      .map((heading) => Number(heading.tagName.slice(1)));
    levels.forEach((level, index) => {
      if (index > 0) expect(level).toBeLessThanOrEqual(levels[index - 1] + 1);
    });
  });
});
