import type { ReactNode } from "react";
import { motion } from "framer-motion";
import site from "virtual:site-config";
import type { SocialIcon } from "../../../config/schema";
import { socialsIn } from "../../../config/socials";
import { InstagramIcon, LinkIcon, SpotifyIcon } from "../../common/SocialIcons";
import { staggerContainer, staggerItem } from "../../../utils/animations";
import "./Music.css";

/** This tab draws two brands' icons; anything else gets the link icon. */
const ICONS: Partial<Record<SocialIcon, ReactNode>> = {
  spotify: <SpotifyIcon className="music-link-icon" />,
  instagram: <InstagramIcon className="music-link-icon" />,
};

/** The music socials and copy, from site.yaml (#188). */
const LINKS = socialsIn(site, "music");
const [INTRO_BEFORE, INTRO_AFTER] = site.music.intro.split("{artist}");

export function Music() {
  return (
    <motion.section
      className="music-section"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.p className="music-intro" variants={staggerItem}>
        {INTRO_BEFORE}
        <span className="music-artist-name">{site.music.artist}</span>
        {INTRO_AFTER}
      </motion.p>

      <motion.div className="music-links" variants={staggerItem}>
        {LINKS.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="music-link"
          >
            {ICONS[link.icon] ?? <LinkIcon className="music-link-icon" />}
            <span>{link.label}</span>
          </a>
        ))}
      </motion.div>

      {site.music.embed && (
        <motion.div className="spotify-embed" variants={staggerItem}>
          <iframe
            src={site.music.embed}
            width="100%"
            height="352"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
            title={site.music.embed_title ?? "music player"}
          ></iframe>
        </motion.div>
      )}
    </motion.section>
  );
}
