/**
 * Claudlobby's URLs, which its project page links to (#173). The owner's own
 * profiles are socials in site/site.yaml (#188).
 */
export const CLAUDLOBBY_REPO = "https://github.com/Claudfather/Claudlobby";

/**
 * Whether a link goes to the Claudlobby repo's front page, where the Star
 * button is: with or without an anchor, a trailing slash or a query like
 * `?tab=readme-ov-file`, which GitHub serves as the same page. The clicks
 * RepoLink counts (#177).
 */
export const isClaudlobbyFrontPage = (href: string) => {
  const url = new URL(href);
  return `${url.origin}${url.pathname.replace(/\/$/, "")}` === CLAUDLOBBY_REPO;
};

export const CLAUDLOBBY_ISSUES = `${CLAUDLOBBY_REPO}/issues`;

export const CLAUDLOBBY_README_QUICKSTART = `${CLAUDLOBBY_REPO}#quick-start`;

export const CLAUDLOBBY_GETTING_STARTED = `${CLAUDLOBBY_REPO}/blob/main/documentation/getting-started.md`;

/** Where Watch → Custom → Releases subscribes, and the same list as a feed. */
export const CLAUDLOBBY_RELEASES = `${CLAUDLOBBY_REPO}/releases`;

export const CLAUDLOBBY_RELEASES_FEED = `${CLAUDLOBBY_REPO}/releases.atom`;
