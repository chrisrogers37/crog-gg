import { describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LogoImage } from "../LogoImage";
import { logoUrl } from "../../../utils/logos";

describe("LogoImage", () => {
  it("renders the domain's self-hosted logo at its size", () => {
    render(<LogoImage domain="meta.com" alt="Meta" size={28} />);
    const img = screen.getByRole("img", { name: "Meta" });
    expect(img).toHaveAttribute("src", logoUrl("meta.com"));
    expect(img).toHaveAttribute("width", "28");
    expect(img).toHaveAttribute("height", "28");
  });

  it("shows the fallback when there is no domain", () => {
    render(<LogoImage domain={undefined} alt="" fallback={<span>fb</span>} />);
    expect(screen.getByText("fb")).toBeInTheDocument();
  });

  it("swaps to the fallback when the logo fails to load", () => {
    render(
      <LogoImage domain="example.org" alt="Example" fallback={<span>fb</span>} />,
    );
    fireEvent.error(screen.getByRole("img", { name: "Example" }));
    expect(screen.getByText("fb")).toBeInTheDocument();
  });

});
