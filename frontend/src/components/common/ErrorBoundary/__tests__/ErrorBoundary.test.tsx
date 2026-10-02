import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "../ErrorBoundary";

/** Throws while `broken.current` is true. */
function Section({ broken }: { broken: { current: boolean } }) {
  if (broken.current) throw new Error("boom");
  return <p>section content</p>;
}

describe("ErrorBoundary in compact mode", () => {
  it("shows the shared load-error panel, and Retry renders the section again", () => {
    // React reports the caught error to the console; that's expected here.
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const broken = { current: true };
    render(
      <ErrorBoundary compact>
        <Section broken={broken} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /something went wrong loading this section/i,
    );

    broken.current = false;
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(screen.getByText("section content")).toBeInTheDocument();
    consoleError.mockRestore();
  });
});
