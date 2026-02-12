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

  it("renders the contact section with email and LinkedIn links", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    const emailLink = screen.getByText("send me an email");
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute("href", "mailto:test@example.com");

    const linkedinLink = screen.getByText("connect on linkedin");
    expect(linkedinLink).toBeInTheDocument();
    expect(linkedinLink).toHaveAttribute(
      "href",
      "https://linkedin.com/in/testuser",
    );
    expect(linkedinLink).toHaveAttribute("target", "_blank");
  });

  it("renders social links from bio data", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    const spotifyLink = screen.getByLabelText("Spotify");
    expect(spotifyLink).toBeInTheDocument();
    expect(spotifyLink).toHaveAttribute(
      "href",
      "https://open.spotify.com/artist/test",
    );

    const hoobeLink = screen.getByLabelText("Hoobe");
    expect(hoobeLink).toBeInTheDocument();
    expect(hoobeLink).toHaveAttribute("href", "https://hoo.be/test");
  });

  it("renders the heading and description text", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    expect(screen.getByText("let's connect")).toBeInTheDocument();
    expect(
      screen.getByText(/interested in working together/),
    ).toBeInTheDocument();
  });
});
