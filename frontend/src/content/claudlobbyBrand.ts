/**
 * Claudlobby's page's look: Claudfather's avatar (the GitHub org Claudlobby
 * lives in) as the page's mark, and the page's own share card. Apart from
 * the page's copy (claudlobby.ts) because the head module reads the card on
 * every page, and the copy should load only with the page.
 *
 * Both are the owner's files in site/public; site:check finds them when the
 * site lists Claudlobby (site-check/claudlobby.test.ts), and
 * content/claudlobby.test.ts holds these words to the copy's rules.
 */

export const CLAUDLOBBY_MARK = { photo: "/profile-photos/claudfather", alt: "Claudfather" };

export const CLAUDLOBBY_CARD = {
  path: "/claudlobby-card.png",
  width: 1200,
  height: 630,
  // The card's words, in its order (site/claudlobby-card.html).
  alt: "Build a dark factory. An open-source agent fleet: manager, engineer and reviewer agents that work 24/7.",
};
