import site from "virtual:site-config";
import { socialsIn } from "../../../config/socials";
import { useBio } from "../../../store";
import { PageSection } from "../../common/PageSection";
import { EmailIcon, SocialMark } from "../../common/SocialIcons";

/** The email address, then site.yaml's contact socials (#188). */
const contactLinks = () => [
  {
    key: "email",
    href: `mailto:${site.owner.email}`,
    icon: <EmailIcon className="link-row-icon" />,
    label: "email",
    external: false,
  },
  ...socialsIn(site, "contact").map((social) => ({
    key: `social-${social.id}`,
    href: social.url,
    icon: <SocialMark icon={social.icon} />,
    label: social.label,
    external: true,
  })),
];

/** The contact section's id: the hero's contact link points here. */
export const CONTACT_ID = "contact";

/** The page's last section: the heading and line from site.yaml, then links. */
export function ContactCTA() {
  const bio = useBio();

  if (!bio) return null;

  return (
    <PageSection id={CONTACT_ID} heading={site.contact.heading} intro={site.contact.text}>
      <div className="link-row">
        {contactLinks().map((link) => (
          <a
            key={link.key}
            href={link.href}
            className="btn btn-ghost btn-sm"
            {...(link.external
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
          >
            {link.icon}
            <span className="link-row-label">{link.label}</span>
          </a>
        ))}
      </div>
      {bio.location && <p className="page-note">{bio.location}</p>}
    </PageSection>
  );
}
