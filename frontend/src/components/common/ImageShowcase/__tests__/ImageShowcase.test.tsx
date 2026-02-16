import { render, screen } from "@testing-library/react";
import { beforeAll, describe, it, expect } from "vitest";
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
  { src: "/profile-photos/photo-1.jpg", alt: "photo one" },
  { src: "/profile-photos/photo-2.jpg", alt: "photo two" },
  { src: "/profile-photos/photo-3.jpg", alt: "photo three" },
  { src: "/profile-photos/photo-4.jpg", alt: "photo four" },
  { src: "/profile-photos/photo-5.jpg", alt: "photo five" },
];

describe("ImageShowcase", () => {
  it("renders images when provided via props", () => {
    render(<ImageShowcase images={mockImages} />);
    const images = screen.getAllByRole("img");
    expect(images).toHaveLength(10); // 5 original + 5 duplicated
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

  it("has presentation role for accessibility", () => {
    render(<ImageShowcase images={mockImages} />);
    const showcase = screen.getByRole("presentation");
    expect(showcase).toBeInTheDocument();
  });

  it("uses lazy loading for images", () => {
    render(<ImageShowcase images={mockImages} />);
    const images = screen.getAllByRole("img");
    images.forEach((img) => {
      expect(img).toHaveAttribute("loading", "lazy");
    });
  });

  it("sets --image-count CSS custom property", () => {
    render(<ImageShowcase images={mockImages} />);
    const track = document.querySelector(".image-showcase-track");
    expect(track).toHaveStyle({ "--image-count": "5" });
  });
});
