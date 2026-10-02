import { render, screen } from "@testing-library/react";
import { beforeAll, describe, it, expect, beforeEach } from "vitest";
import site from "virtual:site-config";
import { socialsIn } from "../../../../config/socials";
import { ContactCTA } from "../ContactCTA";
import { useContentStore } from "../../../../store";
import { makeBio } from "../../../../test/builders";

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

const mockBio = makeBio({ location: "New York" });

describe("ContactCTA", () => {
  beforeEach(() => {
    useContentStore.setState({ bio: null });
  });

  it("does not render when bio is null", () => {
    const { container } = render(<ContactCTA />);
    expect(container.innerHTML).toBe("");
  });

  it("links the email address, then each contact social from site.yaml, in order", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    const contactSocials = socialsIn(site, "contact");
    expect(contactSocials).not.toHaveLength(0);
    // The label, not the whole text: hoobe's icon is a word of its own.
    const links = screen.getAllByRole("link");
    expect(
      links.map((link) => [
        link.querySelector(".contact-brand-label")?.textContent,
        link.getAttribute("href"),
      ]),
    ).toEqual([
      ["email", `mailto:${site.owner.email}`],
      ...contactSocials.map((social) => [social.label, social.url]),
    ]);
  });

  it("opens the socials in a new tab, and the email address in place", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    const [email, ...socials] = screen.getAllByRole("link");
    expect(email).not.toHaveAttribute("target");
    for (const link of socials) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("names each link by its label alone, not its icon", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    for (const social of socialsIn(site, "contact")) {
      expect(screen.getByRole("link", { name: social.label })).toBeInTheDocument();
    }
  });

  it("renders site.yaml's heading and text, and the bio's location", () => {
    useContentStore.setState({ bio: mockBio });
    render(<ContactCTA />);

    expect(
      screen.getByRole("heading", { name: site.contact.heading }),
    ).toBeInTheDocument();
    expect(screen.getByText(site.contact.text)).toBeInTheDocument();
    expect(screen.getByText("New York")).toBeInTheDocument();
  });
});
