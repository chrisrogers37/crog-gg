import { fireEvent, render, screen } from "@testing-library/react";
import { HelmetProvider } from "react-helmet-async";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useContentStore } from "../../../store";
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
    render(
      <HelmetProvider>
        <MemoryRouter>
          <ProjectsPage />
        </MemoryRouter>
      </HelmetProvider>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /failed to load projects/i,
    );
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(loadContent).toHaveBeenCalled();
  });
});
