import { render, screen } from "@testing-library/react";
import { beforeAll, describe, it, expect, beforeEach } from "vitest";
import { ContactCTA } from "../ContactCTA";
import { useContentStore } from "../../../../store";

// framer-motion's whileInView requires IntersectionObserver to be a real class
beforeAll(() => {
  window.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = "";
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(
      _callback: IntersectionObserverCallback,
      _options?: IntersectionObserverInit,
    ) {}
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
  welcome_message: "Hello",
  social_links: {
    github: "https://github.com/testuser",
    linkedin: "https://linkedin.com/in/testuser",
    spotify: "https://open.spotify.com/artist/test",
    hoobe: "https://hoo.be/test",
    telegram: "https://t.me/testuser",
    instagram_personal: "https://instagram.com/testuser",
    instagram_music: "https://instagram.com/testmusic",
  },
};

describe("ContactCTA", () => {
  beforeEach(() => {
    useContentStore.setState({ bio: null });
  });

  it("does not render when bio is null", () => {
    const { container } = render(<ContactCTA />);
    expect(container.innerHTML).toBe("");
  });

  it("renders branded links for email and LinkedIn", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    const emailLink = screen.getByLabelText("Email");
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:test@example.com");

    const linkedinLink = screen.getByLabelText("LinkedIn");
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute(
      "href",
      "https://linkedin.com/in/testuser",
    );
    expect(linkedinLink).toHaveAttribute("target", "_blank");
  });

  it("renders branded social links from bio data", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    const spotifyLink = screen.getByLabelText("Spotify");
    expect(spotifyLink).toBeInTheDocument();
    expect(spotifyLink).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/test",
    );

    const hoobeLink = screen.getByLabelText("hoobe");
    expect(hoobeLink).toBeInTheDocument();
    expect(hoobeLink).toHaveAttribute("href", "https://hoo.be/test");

    const githubLink = screen.getByLabelText("GitHub");
    expect(githubLink).toBeInTheDocument();
    expect(githubLink).toHaveAttribute("href", "https://github.com/testuser");
  });

  it("renders the heading and description text", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    expect(screen.getByText("connect w/ me")).toBeInTheDocument();
    expect(
      screen.getByText(/have a question, or just want to say hey/),
    ).toBeInTheDocument();
  });
});
