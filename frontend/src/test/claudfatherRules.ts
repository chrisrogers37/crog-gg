/**
 * Claudfather's copy rules (#173, #179), shared by its page's copy test
 * (content/claudfather.test.ts) and the site check on its project file, which
 * the card and the page's head show (site-check/projects.test.ts).
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
 * Provider support belongs to the owning products. The evergreen portfolio
 * does not publish a competing inventory or promise universal compatibility.
 */
export const PLANNED =
  /openai|chatgpt|\bgpt|gemini|codex|mistral|llama|qwen|deepseek|grok|local models?|multi[- ]?provider|provider[- ]?agnostic|model[- ]?agnostic|any llm/i;
