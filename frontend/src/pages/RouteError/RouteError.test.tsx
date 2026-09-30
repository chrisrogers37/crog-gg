import { render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RouteError } from "./RouteError";

function Throw(): never {
  throw new Error("boom");
}

// React reports each render error as an uncaught error event too; cancelling
// it keeps jsdom from printing the error this test throws on purpose.
const expectedError = (event: ErrorEvent) => event.preventDefault();

describe("RouteError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    window.addEventListener("error", expectedError);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    window.removeEventListener("error", expectedError);
  });

  it("shows an error with a way out for a page that throws, not the 404 page", () => {
    const router = createMemoryRouter(
      [{ path: "/about", element: <Throw />, errorElement: <RouteError /> }],
      { initialEntries: ["/about"] },
    );
    render(<RouterProvider router={router} />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      /something went wrong/i,
    );
    expect(
      screen.getByRole("button", { name: /reload page/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /home/i })).toHaveAttribute(
      "href",
      "/",
    );
    expect(screen.queryByText("404")).not.toBeInTheDocument();
  });
});
