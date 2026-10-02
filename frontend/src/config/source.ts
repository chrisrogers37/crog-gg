/**
 * Where "view source" goes: the repo at the commit the site was built from,
 * when the build knows it, else the repo itself (#188).
 */
export const sourceUrl = (repo: string, commit: string) =>
  commit ? `${repo.replace(/\/$/, "")}/tree/${commit}` : repo;
