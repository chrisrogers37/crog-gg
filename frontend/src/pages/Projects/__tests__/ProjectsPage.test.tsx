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
  });

  it("says so and offers a retry", () => {
    const loadContent = vi.fn();
    useContentStore.setState({
      projects: [],
      isLoading: false,
      error: "Failed to load content.",
      loadContent,
    });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    expect(screen.getByRole("alert")).toHaveTextContent(
      /failed to load projects/i,
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(loadContent).toHaveBeenCalled();
  });

  it("names the page in the tab while it loads, not only once it has", async () => {
    useContentStore.setState({ projects: [], isLoading: true, error: null });
    renderWithProviders(<ProjectsPage />, { initialRoute: "/projects" });
    await waitFor(() => expect(document.title).toMatch(/^Projects \|/));
  });
});
