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

  it("says a failed load failed, and Retry reloads the content rather than the page", () => {
    const loadContent = vi.fn();
    useContentStore.setState({ isLoading: false, error: "x", loadContent });
    renderWithProviders(<AboutPage />, { initialRoute: "/about" });

    expect(screen.getByRole("alert")).toHaveTextContent(
      /failed to load this page/i,
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(loadContent).toHaveBeenCalled();
  });

  it("names the page in the tab while it loads", async () => {
    useContentStore.setState({ isLoading: true, error: null });
    renderWithProviders(<AboutPage />, { initialRoute: "/about" });

    await waitFor(() => expect(document.title).toMatch(/^About \|/));
  });
});
