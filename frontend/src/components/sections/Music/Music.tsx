import { useEffect, useRef, useState } from "react";
import site from "virtual:site-config";
import { socialsIn } from "../../../config/socials";
import { SocialMark } from "../../common/SocialIcons";
import "./Music.css";

/** The music socials and copy, from site.yaml (#188). */
const LINKS = socialsIn(site, "music");
const [INTRO_BEFORE, INTRO_AFTER] = site.music.intro.split("{artist}");

/**
 * The player, mounted once its box is within a screen of the window. It sits
 * far down the page, and costs about 840 kB from Spotify that a visitor who
 * never scrolls there shouldn't pay; `loading="lazy"` let Chrome fetch it on
 * most first loads. The box holds the player's height meanwhile, so nothing
 * moves when it mounts.
 */
function Player({ src, title }: { src: string; title: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const element = box.current;
    if (!element || near) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setNear(true);
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [near]);

  return (
    <div className="spotify-embed" ref={box}>
      {near && (
        <iframe
          src={src}
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          title={title}
        ></iframe>
      )}
    </div>
  );
}

export function Music() {
  return (
    <>
      <p className="page-lead music-intro">
        {INTRO_BEFORE}
        <span className="music-artist-name">{site.music.artist}</span>
        {INTRO_AFTER}
      </p>

      <div className="link-row">
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost btn-sm"
          >
            <SocialMark icon={link.icon} />
            <span className="link-row-label">{link.label}</span>
          </a>
        ))}
      </div>

      {site.music.embed && (
        <Player src={site.music.embed} title={site.music.embed_title ?? "music player"} />
      )}
    </>
  );
}
