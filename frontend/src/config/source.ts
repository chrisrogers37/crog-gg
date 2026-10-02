/**
 * Where "view source" goes: the repo at the commit the site was built from,
 * when the build knows it and the repo is a GitHub repo's root, whose
 * /tree/<commit> URLs this knows (#188). Otherwise, the URL as site.yaml gives it.
 */
export function sourceUrl(repo: string, commit: string): string {
  if (!commit) return repo;
  const url = new URL(repo);
  const isRepoRoot = /^\/[^/]+\/[^/]+\/?$/.test(url.pathname);
  return url.host === "github.com" && isRepoRoot
    ? `${url.origin}${url.pathname.replace(/\/$/, "")}/tree/${commit}`
    : repo;
}
