import { render, screen } from "@testing-library/react";
import { beforeAll, describe, it, expect, beforeEach } from "vitest";
import { Music } from "../Music";
import { useContentStore } from "../../../../store";

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

const mockBio = {
  display_name: "Test User",
  email: "test@example.com",
  location: "New York",
  about_text: "About me",
  social_links: {
    github: "https://github.com/testuser",
    linkedin: "https://linkedin.com/in/testuser",
    spotify: "https://open.spotify.com/artist/testid",
    hoobe: "https://hoo.be/test",
    instagram_music: "https://instagram.com/crogmusic",
  },
};

describe("Music", () => {
  beforeEach(() => {
    useContentStore.setState({ bio: null });
  });

  it("renders intro text with artist name", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    expect(screen.getByText(/electronic music/i)).toBeInTheDocument();
    expect(screen.getByText("crog")).toBeInTheDocument();
  });

  it("renders Spotify link with correct URL", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    const link = screen.getByRole("link", { name: "Spotify" });
    expect(link).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/testid",
    );
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders Instagram music link", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    const link = screen.getByRole("link", { name: "@crogmusic" });
    expect(link).toHaveAttribute("href", "https://instagram.com/crogmusic");
  });

  it("renders Hoobe link", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    const link = screen.getByRole("link", { name: "all links" });
    expect(link).toHaveAttribute("href", "https://hoo.be/test");
  });

  it("renders Spotify embed", () => {
    useContentStore.setState({ bio: mockBio });
    render(<Music />);
    expect(screen.getByTitle("Spotify Player")).toBeInTheDocument();
  });

  it("uses fallback URLs when bio is null", () => {
    render(<Music />);
    const link = screen.getByRole("link", { name: "Spotify" });
    expect(link).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
    );
  });
});
