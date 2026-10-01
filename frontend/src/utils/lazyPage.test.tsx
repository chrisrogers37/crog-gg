import { render, screen, waitFor } from "@testing-library/react";
import { Suspense } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteError } from "../pages/RouteError";
import { lazyPage } from "./lazyPage";

const { reloadOnce } = vi.hoisted(() => ({
  reloadOnce: vi.fn<() => boolean>(),
}));
vi.mock("./reloadOnce", () => ({ reloadOnce }));

// React reports each render error as an uncaught error event too; cancelling
// it keeps jsdom from printing the error these tests cause on purpose.
const expectedError = (event: ErrorEvent) => event.preventDefault();

/** Renders a route whose page's chunk fails to load. */
function renderPageThatWontLoad() {
  const Page = lazyPage(() =>
    Promise.reject(
      new TypeError("Failed to fetch dynamically imported module: /assets/Page-old.js"),
    ),
  );
  const router = createMemoryRouter([
    {
      path: "/",
      element: (
        <Suspense fallback={<p>loading</p>}>
          <Page />
        </Suspense>
      ),
      errorElement: <RouteError />,
    },
  ]);
  render(<RouterProvider router={router} />);
}

describe("lazyPage", () => {
  beforeEach(() => {
    reloadOnce.mockReset();
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.addEventListener("error", expectedError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.removeEventListener("error", expectedError);
  });

  it("reloads for a chunk a deploy replaced, and stays loading until it lands", async () => {
    reloadOnce.mockReturnValue(true);

    renderPageThatWontLoad();

    await waitFor(() => expect(reloadOnce).toHaveBeenCalledTimes(1));
    expect(screen.getByText("loading")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the route's error instead of reloading while offline", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    reloadOnce.mockReturnValue(true);

    renderPageThatWontLoad();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(reloadOnce).not.toHaveBeenCalled();
  });

  it("shows the route's error once this tab has reloaded for it", async () => {
    reloadOnce.mockReturnValue(false);

    renderPageThatWontLoad();

    expect(await screen.findByRole("alert")).toBeInTheDocument();
  });
});
