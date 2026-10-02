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

function Page({
  active,
  onChange,
}: {
  active: string;
  onChange: (id: string) => void;
}) {
  useSectionMenu(SECTIONS, active, onChange);
  return null;
}

describe("useSectionMenu", () => {
  it("lists the page's sections with the open one, follows it, and leaves on unmount", () => {
    const register = vi.fn<(menu: SectionMenu | null) => void>();
    const first = vi.fn();
    const second = vi.fn();
    const withMenu = (page: React.ReactNode) => (
      <SectionMenuContext.Provider value={register}>
        {page}
      </SectionMenuContext.Provider>
    );

    const { rerender, unmount } = render(
      withMenu(<Page active="one" onChange={first} />),
    );
    const menu = register.mock.lastCall?.[0];
    expect(menu).toMatchObject({ sections: SECTIONS, activeSection: "one" });

    // A new handler alone doesn't re-register; the menu calls the latest one.
    const calls = register.mock.calls.length;
    rerender(withMenu(<Page active="one" onChange={second} />));
    expect(register.mock.calls).toHaveLength(calls);
    menu?.onSectionChange("two");
    expect(second).toHaveBeenCalledWith("two");
    expect(first).not.toHaveBeenCalled();

    // Opening another section re-registers with it marked.
    rerender(withMenu(<Page active="two" onChange={second} />));
    expect(register.mock.lastCall?.[0]).toMatchObject({ activeSection: "two" });

    unmount();
    expect(register).toHaveBeenLastCalledWith(null);
  });
});
