import { useBio } from "../../../store";
import "./Music.css";

const LINKS = {
  spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
  hoobe: "https://hoo.be/crog",
} as const;

/**
 * Music Section
 *
 * Displays music links and Spotify embed.
 */
export function Music() {
  const bio = useBio();

  return (
    <section className="music-section">
      <div className="links-grid">
        <a
          href={bio?.social_links?.spotify || LINKS.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="portfolio-link"
        >
          <i className="fab fa-spotify"></i>
          <div>
            <span className="link-title">Spotify</span>
            <span className="link-description">
              Listen to my music on Spotify
            </span>
          </div>
        </a>
        <a
          href={bio?.social_links?.hoobe || LINKS.hoobe}
          target="_blank"
          rel="noopener noreferrer"
          className="portfolio-link"
        >
          <i className="fas fa-link"></i>
          <div>
            <span className="link-title">Music Links</span>
            <span className="link-description">Find me on other platforms</span>
          </div>
        </a>
      </div>
      <div className="spotify-embed">
        <iframe
          src="https://open.spotify.com/embed/artist/0UotSScPTiSFPmbmjam2jn?utm_source=generator"
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Player"
        ></iframe>
      </div>
    </section>
  );
}
