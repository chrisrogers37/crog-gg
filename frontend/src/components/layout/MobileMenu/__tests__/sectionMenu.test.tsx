import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import {
  SectionMenuContext,
  useSectionMenu,
  type SectionLink,
  type SectionMenu,
} from "../sectionMenu";

const SECTIONS: SectionLink[] = [
  { id: "one", label: "One" },
  { id: "two", label: "Two" },
];

function Page() {
  useSectionMenu(SECTIONS);
  return null;
}

describe("useSectionMenu", () => {
  it("lists the page's sections while it's mounted, once, and leaves on unmount", () => {
    const register = vi.fn<(menu: SectionMenu | null) => void>();
    const withMenu = (page: React.ReactNode) => (
      <SectionMenuContext.Provider value={register}>{page}</SectionMenuContext.Provider>
    );

    const { rerender, unmount } = render(withMenu(<Page />));
    expect(register).toHaveBeenLastCalledWith({ sections: SECTIONS });

    // A re-render with the same sections doesn't register them again.
    const calls = register.mock.calls.length;
    rerender(withMenu(<Page />));
    expect(register.mock.calls).toHaveLength(calls);

    unmount();
    expect(register).toHaveBeenLastCalledWith(null);
  });
});
