import { motion } from "framer-motion";
import { useBio } from "../../../store";
import { staggerContainer, staggerItem } from "../../../utils/animations";
import "./Music.css";

const LINKS = {
  spotify: "https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn",
  hoobe: "https://hoo.be/crog",
  instagram_music: "https://instagram.com/crogmusic",
} as const;

export function Music() {
  const bio = useBio();

  const spotifyUrl = bio?.social_links?.spotify || LINKS.spotify;
  const hoobeUrl = bio?.social_links?.hoobe || LINKS.hoobe;
  const instagramMusicUrl =
    bio?.social_links?.instagram_music || LINKS.instagram_music;

  return (
    <motion.section
      className="music-section"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.p className="music-intro" variants={staggerItem}>
        i make electronic music under the name{" "}
        <span className="music-artist-name">crog</span>. here's some of what
        i've been working on.
      </motion.p>

      <motion.div className="music-links" variants={staggerItem}>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="music-link"
          aria-label="Spotify"
        >
          <i className="fab fa-spotify"></i>
          <span>Spotify</span>
        </a>
        <a
          href={instagramMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="music-link"
          aria-label="@crogmusic"
        >
          <i className="fab fa-instagram"></i>
          <span>@crogmusic</span>
        </a>
        <a
          href={hoobeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="music-link"
          aria-label="all music links"
        >
          <i className="fas fa-link"></i>
          <span>all links</span>
        </a>
      </motion.div>

      <motion.div className="spotify-embed" variants={staggerItem}>
        <iframe
          src="https://open.spotify.com/embed/artist/0UotSScPTiSFPmbmjam2jn?utm_source=generator"
          width="100%"
          height="352"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          title="Spotify Player"
        ></iframe>
      </motion.div>
    </motion.section>
  );
}
