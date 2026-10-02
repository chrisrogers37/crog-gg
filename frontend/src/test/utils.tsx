/* eslint-disable react-refresh/only-export-components */
import { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { HelmetProvider } from "react-helmet-async";

/**
 * Custom render function that wraps components with necessary providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
  initialRoute?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  options?: CustomRenderOptions,
) {
  const { initialRoute = "/", ...renderOptions } = options || {};

  return render(ui, {
    wrapper: ({ children }) => (
      <HelmetProvider>
        <MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
      </HelmetProvider>
    ),
    ...renderOptions,
  });
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
