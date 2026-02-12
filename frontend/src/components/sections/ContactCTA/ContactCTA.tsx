import { motion } from "framer-motion";
import { useBio } from "../../../store";
import "./ContactCTA.css";

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
      <h3 className="contact-cta-heading">let's connect</h3>
      <p className="contact-cta-text">
        interested in working together, have a question, or just want to say
        hey? i'd love to hear from you.
      </p>
      <div className="contact-cta-links">
        <a
          href={`mailto:${bio.email}`}
          className="contact-cta-btn contact-cta-primary"
        >
          send me an email
        </a>
        <a
          href={bio.social_links?.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="contact-cta-btn contact-cta-secondary"
        >
          connect on linkedin
        </a>
      </div>
      <div className="contact-cta-social">
        {bio.social_links?.spotify && (
          <a
            href={bio.social_links.spotify}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Spotify"
          >
            Spotify
          </a>
        )}
        {bio.social_links?.hoobe && (
          <a
            href={bio.social_links.hoobe}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Hoobe"
          >
            Hoobe
          </a>
        )}
      </div>
    </motion.section>
  );
}
