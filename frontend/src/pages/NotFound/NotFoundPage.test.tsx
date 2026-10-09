import { describe, expect, it } from "vitest";
import site from "virtual:site-config";
import { renderWithProviders, screen } from "../../test/utils";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("reads the site's copy and offers a way home", () => {
    renderWithProviders(<NotFoundPage />, { initialRoute: "/missing" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(site.page_copy.not_found.heading);
    expect(screen.getByText(site.page_copy.not_found.text)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: site.page_copy.not_found.home_link })).toHaveAttribute("href", "/");
  });
});
