import { afterEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../../../store";
import {
  fireEvent,
  renderWithProviders,
  screen,
  waitFor,
} from "../../../test/utils";
import { AboutPage } from "../AboutPage";

// Restored after each test, so a stubbed action can't leak into the next.
const INITIAL = useContentStore.getState();

describe("AboutPage before its content arrives", () => {
  afterEach(() => {
    useContentStore.setState(INITIAL, true);
  });

  it("says a failed load failed, naming the file, and Retry reloads the content rather than the page", () => {
    const loadContent = vi.fn();
    useContentStore.setState({
      loads: { ...INITIAL.loads, bio: { error: "content/bio.yaml didn't load (404)" } },
      loadContent,
    });
    renderWithProviders(<AboutPage />, { initialRoute: "/about" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      "This page didn't load: content/bio.yaml didn't load (404).",
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(loadContent).toHaveBeenCalled();
  });

  it("names the page in the tab while it loads", async () => {
    useContentStore.setState({ loads: { ...INITIAL.loads, bio: "loading" } });
    renderWithProviders(<AboutPage />, { initialRoute: "/about" });

    await waitFor(() => expect(document.title).toMatch(/^About \|/));
  });
});
