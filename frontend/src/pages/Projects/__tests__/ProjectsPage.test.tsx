import { afterEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../../../store";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "../../../test/utils";
import { ProjectsPage } from "../ProjectsPage";

// Restored after each test, so a stubbed action can't leak into the next.
const INITIAL = useContentStore.getState();

describe("ProjectsPage when the content failed to load", () => {
  afterEach(() => {
    useContentStore.setState(INITIAL, true);
    // Helmet never clears the title, so a test reading it starts from none.
    document.title = "";
  });

  it("names the file that didn't load, and retries the projects alone (#190 M23)", () => {
    const reloadProjects = vi.fn();
    useContentStore.setState({
      projects: [],
      loads: { ...INITIAL.loads, projects: { error: "content/projects/index.yaml didn't load (500)" } },
      reloadProjects,
    });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The projects didn't load: content/projects/index.yaml didn't load (500).",
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(reloadProjects).toHaveBeenCalled();
  });

  it("says when there's nothing to show, rather than loading forever (#190 M23)", () => {
    useContentStore.setState({ projects: [], loads: { ...INITIAL.loads, projects: "ready" } });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    expect(screen.getByText("No projects yet.")).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: /loading projects/i })).toBeNull();
  });

  it("names the page in the tab while it loads, not only once it has", async () => {
    useContentStore.setState({ projects: [], loads: { ...INITIAL.loads, projects: "loading" } });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    await waitFor(() => expect(document.title).toMatch(/^Projects \|/));
  });
});
