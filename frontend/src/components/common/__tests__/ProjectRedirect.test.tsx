import { render, waitFor } from "@testing-library/react";
import { createMemoryRouter, matchRoutes } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import { routes } from "../../../router";
import { ProjectRedirect } from "../ProjectRedirect";

describe("old project links", () => {
  it.each(["quickstart", "updates", "roadmap", "claudlobby"])(
    "preserves query and #%s, replacing history",
    async (hash) => {
      const route = matchRoutes(routes, "/projects/claudlobby")!.at(-1)!.route;
      expect(route.element).toEqual(
        <ProjectRedirect to="/projects/claudfather" />,
      );
      const router = createMemoryRouter(
        [
          { ...route, path: "/projects/claudlobby" },
          { path: "/projects/claudfather", element: <p>ecosystem</p> },
        ],
        {
          initialEntries: [
            `/projects/claudlobby?utm_source=shared&ref=old#${hash}`,
          ],
        },
      );
      render(<RouterProvider router={router} />);
      await waitFor(() =>
        expect(router.state.location.pathname).toBe("/projects/claudfather"),
      );
      expect(router.state.location.search).toBe("?utm_source=shared&ref=old");
      expect(router.state.location.hash).toBe(`#${hash}`);
      expect(router.state.historyAction).toBe("REPLACE");
    },
  );
});
