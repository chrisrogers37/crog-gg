import {
  inject,
  track as send,
  type BeforeSendEvent,
} from "@vercel/analytics";

/**
 * Cookieless visit and conversion counts: Vercel Web Analytics (#177). Its
 * script and beacons are served from this origin (/_vercel/insights/*), so
 * the CSP's 'self' already allows them. Vercel only serves that path once Web
 * Analytics is enabled on the project (see the README). Every event goes
 * through track(), so a change of provider touches only this file.
 *
 * Only production builds report; the dev server and tests send nothing.
 */

/**
 * Where a link to the Claudlobby repo's front page sits: its page's hero and
 * quickstart, the featured card on / and /projects, or the ecosystem family.
 */
export type RepoLinkLocation = "hero" | "quickstart" | "featured" | "family";

export type AnalyticsEvent =
  | { name: "repo_click"; location: RepoLinkLocation }
  | { name: "quickstart_click" }
  | { name: "updates_click" };

/**
 * What reaches Vercel keeps its path and any utm_* campaign tags. Every other
 * query parameter goes, and so does the fragment, so nothing personal a link
 * carries (an address in its query, a token after its #) is ever reported.
 * Browsers never send a fragment to a server; without this, the script would.
 */
export function keepCampaignParams(event: BeforeSendEvent): BeforeSendEvent {
  const url = new URL(event.url);
  for (const key of [...url.searchParams.keys()]) {
    if (!key.startsWith("utm_")) url.searchParams.delete(key);
  }
  url.hash = "";
  return { ...event, url: url.toString() };
}

/**
 * Loads the script, which counts this pageview and every client-side one
 * after it. Events tracked before it arrives wait in the queue inject() sets
 * up. Called once, from main.tsx.
 */
export function startAnalytics() {
  if (import.meta.env.PROD) {
    inject({ mode: "production", beforeSend: keepCampaignParams });
  }
}

export function track({ name, ...properties }: AnalyticsEvent) {
  if (import.meta.env.PROD) send(name, properties);
}
