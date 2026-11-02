/**
 * Portfolio story, separate from the product's current install guidance.
 * Product wording: Benzo main eed0a969b097142042dc4412424fbc71a04d2c0d.
 * Origin: the owner's account of their 2019 Intel MacBook and studio setup.
 * URLs come from the project's YAML, not another copy of the owner's links.
 */
export const benzo = {
  eyebrow: "a small macOS menu bar utility",
  headline: "a little pill for a Mac that won’t call it a night.",
  lead: "sleep controls and a view of the apps that may be keeping your Mac awake, right in the menu bar.",
  markCaption: "the anti-Amphetamine for Mac",
  websiteLabel: "visit Benzo",
  downloadLabel: "get the Mac app",
  downloadNote: "downloads open GitHub Releases. installation happens on a Mac.",
  story: {
    heading: "built because I wanted my Mac to sleep when I do.",
    body: "my 2019 Intel MacBook would sit plugged into external gear, screen off, still running hot with the fans going. closing up for the day shouldn’t mean unplugging the whole desk. that’s where Benzo started.",
    context: "docks, displays, audio gear and background apps can keep a Mac awake or wake it again. Benzo puts the settings and reported blockers in one small panel, so you can check your setup before leaving the desk.",
  },
  features: [
    { title: "choose your sleep settings", body: "adjust sleep and wake options, then request sleep when your work is finished." },
    { title: "see what’s keeping it awake", body: "check the blockers macOS reports, recent sleep sessions and wake reasons." },
    { title: "keep it in the menu bar", body: "open the pill, make your changes, and get back to whatever you were doing." },
  ],
  handoff: {
    heading: "try it before you download.",
    body: "the Benzo site has an interactive demo. try the switch, timer and Options before you download; the demo won’t change your Mac’s settings.",
    label: "try the interactive demo",
    note: "the native app needs administrator setup. sleep behavior depends on your Mac and connected gear, and recovery has limits. read the current installation notes before using it.",
    setupLabel: "installation & current limits",
  },
  sourceLabel: "source on GitHub",
  helpLabel: "report an issue",
  stackLabel: "built with",
} as const;
