import { render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, it, expect } from "vitest";
import site from "virtual:site-config";
import { socialsIn } from "../../../../config/socials";
import { Music } from "../Music";

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

describe("Music", () => {
  const { embed, embed_title: embedTitle } = site.music;
  afterEach(() => {
    site.music.embed = embed;
    site.music.embed_title = embedTitle;
  });

  it("introduces the artist by name, as site.yaml words it", () => {
    const { container } = render(<Music />);
    expect(screen.getByText(site.music.artist)).toHaveClass("music-artist-name");
    expect(container.querySelector(".music-intro")).toHaveTextContent(
      site.music.intro.replace("{artist}", site.music.artist),
    );
  });

  it("links each music social from site.yaml, in order, in a new tab", () => {
    render(<Music />);

    const musicSocials = socialsIn(site, "music");
    expect(musicSocials).not.toHaveLength(0);
    const links = screen.getAllByRole("link");
    expect(
      links.map((link) => [link.textContent, link.getAttribute("href")]),
    ).toEqual(musicSocials.map((social) => [social.label, social.url]));
    for (const link of links) {
      expect(link).toHaveAttribute("target", "_blank");
    }
  });

  it("embeds the player site.yaml names, by the title it gives", () => {
    site.music.embed = "https://player.example/embed/1";
    site.music.embed_title = "a player";
    render(<Music />);
    expect(screen.getByTitle("a player")).toHaveAttribute(
      "src",
      "https://player.example/embed/1",
    );
  });

  it("shows no player when site.yaml leaves it empty", () => {
    site.music.embed = undefined;
    render(<Music />);
    expect(screen.queryByTitle(site.music.embed_title ?? "music player")).toBeNull();
  });
});
