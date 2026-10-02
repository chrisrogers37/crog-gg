import { slate } from "../styles/palette";

/** The bubble colour for a skill in no category, or with an unusable colour. */
export const DEFAULT_SKILL_COLOR = slate[500];

/**
 * A skill category's colour as #rrggbb, so SkillBubbles can append an alpha
 * pair to it. #rgb is expanded; anything else (a named colour, say) falls back
 * to the default rather than producing CSS the browser silently drops (#193).
 * timelineLoader applies it once, as the YAML loads.
 */
export function skillColor(raw?: string): string {
  const hex = raw ? /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(raw)?.[1] : undefined;
  if (!hex) return DEFAULT_SKILL_COLOR;
  return hex.length === 3
    ? `#${[...hex].map((digit) => digit + digit).join("")}`
    : `#${hex}`;
}
