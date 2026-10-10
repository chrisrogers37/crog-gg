import type { WebsiteDestination } from "../../../content/claudfather";

/** One authored destination and qualifier, wherever the product site appears. */
export function WebsiteLink({
  website,
}: {
  website: WebsiteDestination | null;
}) {
  if (!website) return null;
  return (
    <div className="cf-website" data-state={website.state}>
      <a
        className="btn btn-ghost"
        href={website.url}
        target="_blank"
        rel="noopener noreferrer"
      >
        {website.label}
      </a>
      <p className="page-note">{website.caveat}</p>
    </div>
  );
}
