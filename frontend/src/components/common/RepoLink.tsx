import type { ReactNode } from "react";
import { CLAUDLOBBY_REPO, isClaudlobbyFrontPage } from "../../content/links";
import { track, type RepoLinkLocation } from "../../services/analytics";

type RepoLinkProps = {
  /** Reported with the click, so the dashboard can tell the links apart. */
  location: RepoLinkLocation;
  /** Where it goes: Claudlobby's front page unless it says otherwise. */
  href?: string;
  className?: string;
  onClick?: () => void;
  children: ReactNode;
};

/**
 * A link into a repo, in a new tab. A click to the Claudlobby repo's front
 * page, where the Star button is, is reported as a repo_click (#177): a visit
 * to the repo, which may or may not end in a star, so it isn't counted as a
 * star. A link to any other repo is just a link.
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
        if (isClaudlobbyFrontPage(href)) track({ name: "repo_click", location });
        onClick?.();
      }}
    >
      {children}
    </a>
  );
}
