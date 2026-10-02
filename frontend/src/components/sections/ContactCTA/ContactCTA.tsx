import type { ReactNode } from "react";
import { motion } from "framer-motion";
import site from "virtual:site-config";
import type { SocialIcon } from "../../../config/schema";
import { socialsIn } from "../../../config/socials";
import { useBio } from "../../../store";
import { GitHubMark } from "../../common/GitHubMark";
import "./ContactCTA.css";

function LinkedInLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 72 72" className="contact-brand-icon">
      <path
        d="M8.421 72h13.264V27.895H8.421V72zM15.053 0C9.895 0 5.684 4.211 5.684 9.474 5.684 14.736 9.895 18.947 15.053 18.947c5.263 0 9.473-4.211 9.473-9.473C24.526 4.21 20.316 0 15.053 0zM50.21 27.895c-5.684 0-9.894 2.526-12 5.473v-5.473H25.263V72h13.263V48.632c0-6.316 2.947-9.474 8.21-9.474 4.843 0 7.369 3.158 7.369 9.474V72h13.264V44.842c0-11.369-6.316-16.947-16.842-16.947z"
        fill="currentColor"
      />
    </svg>
  );
}

function TelegramLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 240 240" className="contact-brand-icon">
      <path
        d="M120 0C53.726 0 0 53.726 0 120s53.726 120 120 120 120-53.726 120-120S186.274 0 120 0zm56.914 82.666l-19.562 92.19c-1.474 6.502-5.322 8.112-10.79 5.05l-29.783-21.95-14.373 13.83c-1.592 1.592-2.92 2.92-5.986 2.92l2.14-30.335 55.177-49.86c2.399-2.134-.522-3.32-3.726-1.186l-68.19 42.937-29.369-9.168c-6.388-1.995-6.51-6.388 1.33-9.454l114.81-44.252c5.32-1.918 9.97 1.33 8.236 9.454z"
        fill="currentColor"
      />
    </svg>
  );
}

function InstagramLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 448 512" className="contact-brand-icon">
      <path
        d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"
        fill="currentColor"
      />
    </svg>
  );
}

function SpotifyLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 496 512" className="contact-brand-icon">
      <path
        d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8zm100.7 364.9c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4zm26.9-65.6c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm31-76.2c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3z"
        fill="currentColor"
      />
    </svg>
  );
}

function HoobeLogo() {
  return (
    <span className="contact-brand-text" aria-hidden="true">
      hoobe
    </span>
  );
}

function LinkIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="contact-brand-icon"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function EmailIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="contact-brand-icon">
      <path
        d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
        fill="currentColor"
      />
    </svg>
  );
}

const ICONS: Record<SocialIcon, ReactNode> = {
  github: <GitHubMark className="contact-brand-icon" />,
  linkedin: <LinkedInLogo />,
  telegram: <TelegramLogo />,
  instagram: <InstagramLogo />,
  spotify: <SpotifyLogo />,
  hoobe: <HoobeLogo />,
  link: <LinkIcon />,
};

/** The email address, then site.yaml's contact socials (#188). */
const LINKS = [
  {
    key: "email",
    href: `mailto:${site.owner.email}`,
    icon: <EmailIcon />,
    label: "email",
    external: false,
  },
  ...socialsIn(site, "contact").map((social) => ({
    key: social.id,
    href: social.url,
    icon: ICONS[social.icon],
    label: social.label,
    external: true,
  })),
];

export function ContactCTA() {
  const bio = useBio();

  if (!bio) return null;

  return (
    <motion.section
      className="contact-cta"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="contact-cta-heading">{site.contact.heading}</h2>
      <p className="contact-cta-text">{site.contact.text}</p>
      <div className="contact-brand-links">
        {LINKS.map((link) => (
          <a
            key={link.key}
            href={link.href}
            className="contact-brand-link"
            {...(link.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {link.icon}
            <span className="contact-brand-label">{link.label}</span>
          </a>
        ))}
      </div>
      {bio.location && <p className="contact-location">{bio.location}</p>}
    </motion.section>
  );
}
