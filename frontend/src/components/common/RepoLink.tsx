import type { ReactNode } from "react";
import { CLAUDLOBBY_REPO } from "../../content/links";
import { track, type RepoLinkLocation } from "../../services/analytics";

type RepoLinkProps = {
  /** Reported with the click, so the dashboard can tell the links apart. */
  location: RepoLinkLocation;
  /** The repo's front page, or an anchor on it. */
  href?: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

/**
 * A link to the Claudlobby repo's front page, where the Star button is. Each
 * click is reported as a star_click (#177).
 */
export function RepoLink({
  location,
  href = CLAUDLOBBY_REPO,
  className,
  onClick,
  children,
}: RepoLinkProps) {
  return (
    <a
      className={className}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => {
        track({ name: "star_click", location });
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
