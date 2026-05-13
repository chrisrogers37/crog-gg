import { motion } from "framer-motion";
import { useBio } from "../../../store";
import { staggerContainer, staggerItem } from "../../../utils/animations";
import { Link as LinkIcon } from "lucide-react";
import "./Music.css";

const SPOTIFY_ARTIST_ID = "0UotSScPTiSFPmbmjam2jn";
const LINKS = {
  spotify: `https://open.spotify.com/artist/${SPOTIFY_ARTIST_ID}`,
  instagram_music: "https://instagram.com/crogmusic",
} as const;

function SpotifyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

export function Music() {
  const bio = useBio();

  const spotifyUrl = bio?.social_links?.spotify || LINKS.spotify;
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
          <SpotifyIcon size={16} />
          <span>Spotify</span>
        </a>
        <a
          href={instagramMusicUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="music-link"
          aria-label="@crogmusic"
        >
          <InstagramIcon size={16} />
          <span>@crogmusic</span>
        </a>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="music-link"
          aria-label="all music links"
        >
          <LinkIcon size={16} />
          <span>all links</span>
        </a>
      </motion.div>

      <motion.div className="spotify-embed" variants={staggerItem}>
        <iframe
          src={`https://open.spotify.com/embed/artist/${SPOTIFY_ARTIST_ID}?utm_source=generator`}
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
