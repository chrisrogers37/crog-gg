/**
 * The landing page's copy rules (#173, #179), shared by the copy's own test
 * (content/claudlobby.test.ts) and the share card's (site-check/landing.test.ts).
 */

/** Every string in the value. */
export const strings = (value: unknown): string[] =>
  typeof value === "string"
    ? [value]
    : Array.isArray(value)
      ? value.flatMap(strings)
      : value && typeof value === "object"
        ? Object.values(value).flatMap(strings)
        : [];

/**
 * Other agents and providers are the plan, not the product: they may be named
 * only where the page says they're planned.
 */
export const PLANNED =
  /openai|chatgpt|\bgpt|gemini|codex|mistral|llama|qwen|deepseek|grok|local models?|multi[- ]?provider|provider[- ]?agnostic|model[- ]?agnostic|any llm/i;
