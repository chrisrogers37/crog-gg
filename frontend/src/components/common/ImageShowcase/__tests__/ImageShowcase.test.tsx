import { render, screen } from "@testing-library/react";
import { beforeAll, describe, it, expect } from "vitest";
import site from "virtual:site-config";
import { ImageShowcase } from "../ImageShowcase";

beforeAll(() => {
  window.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
});

const mockImages = [
  { src: "/profile-photos/photo-1", alt: "photo one" },
  { src: "/profile-photos/photo-2", alt: "photo two" },
  { src: "/profile-photos/photo-3", alt: "photo three" },
  { src: "/profile-photos/photo-4", alt: "photo four" },
  { src: "/profile-photos/photo-5", alt: "photo five" },
];

describe("ImageShowcase", () => {
  it("renders images when provided via props", () => {
    const { container } = render(<ImageShowcase images={mockImages} />);
    // Every photo appears once, visually and in the accessibility tree.
    expect(container.querySelectorAll("img")).toHaveLength(mockImages.length);
    expect(screen.getAllByRole("img")).toHaveLength(5);
  });

  it("serves resized WebP variants instead of the originals", () => {
    const { container } = render(<ImageShowcase images={mockImages} />);
    const first = container.querySelector("img")!;
    expect(first).toHaveAttribute("src", "/profile-photos/photo-1-480.webp");
    expect(first.getAttribute("srcset")).toContain(
      "/profile-photos/photo-1-160.webp 160w",
    );
    expect(first).toHaveAttribute("sizes");
  });

  it("renders with correct alt text", () => {
    render(<ImageShowcase images={mockImages} />);
    const firstImage = screen.getAllByAltText("photo one");
    expect(firstImage.length).toBeGreaterThan(0);
  });

  it("does not render when fewer than 3 images", () => {
    const twoImages = mockImages.slice(0, 2);
    const { container } = render(<ImageShowcase images={twoImages} />);
    expect(container.innerHTML).toBe("");
  });

  it("does not render when images is empty", () => {
    const { container } = render(<ImageShowcase images={[]} />);
    expect(container.innerHTML).toBe("");
  });

  it("is a labelled group of photos", () => {
    render(<ImageShowcase images={mockImages} />);
    expect(
      screen.getByRole("group", { name: `Photos of ${site.owner.name}` }),
    ).toBeInTheDocument();
  });

  it("uses lazy loading for images", () => {
    const { container } = render(<ImageShowcase images={mockImages} />);
    container.querySelectorAll("img").forEach((img) => {
      expect(img).toHaveAttribute("loading", "lazy");
    });
  });

  it("lets keyboard users focus the strip to scroll it", () => {
    render(<ImageShowcase images={mockImages} />);
    expect(screen.getByRole("group", { name: `Photos of ${site.owner.name}` })).toHaveAttribute("tabindex", "0");
  });
});
