import type { ReactNode } from "react";
import { motion } from "framer-motion";
import site from "virtual:site-config";
import type { SocialIcon } from "../../../config/schema";
import { socialsIn } from "../../../config/socials";
import { useBio } from "../../../store";
import { GitHubMark } from "../../common/GitHubMark";
import { InstagramIcon, LinkIcon, SpotifyIcon } from "../../common/SocialIcons";
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

function HoobeLogo() {
  return (
    <span className="contact-brand-text" aria-hidden="true">
      hoobe
    </span>
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
  instagram: <InstagramIcon className="contact-brand-icon" />,
  spotify: <SpotifyIcon className="contact-brand-icon" />,
  hoobe: <HoobeLogo />,
  link: <LinkIcon className="contact-brand-icon" />,
};

/** The email address, then site.yaml's contact socials (#188). */
const contactLinks = () => [
  {
    key: "email",
    href: `mailto:${site.owner.email}`,
    icon: <EmailIcon />,
    label: "email",
    external: false,
  },
  ...socialsIn(site, "contact").map((social) => ({
    key: `social-${social.id}`,
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
        {contactLinks().map((link) => (
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
