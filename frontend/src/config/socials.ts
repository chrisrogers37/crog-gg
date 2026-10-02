import type { SiteConfig, Social, SocialPlace } from "./schema";

/** The socials that show in `place`, in the order site.yaml lists them. */
export const socialsIn = (config: SiteConfig, place: SocialPlace): Social[] =>
  config.socials.filter((entry) => entry.show_in.includes(place));
