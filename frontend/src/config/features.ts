import type { FeatureMode } from "./schema";

/** What GET /api/features says this deployment can serve (#189 M21). */
export type Features = {
  regenerate: boolean;
  github: boolean;
};

/** Until the API answers, and when it can't: nothing is served. */
export const NO_FEATURES: Features = { regenerate: false, github: false };

/** The API's reply, if it has that shape; anything else serves nothing. */
export function parseFeatures(body: unknown): Features {
  if (typeof body !== "object" || body === null) return NO_FEATURES;
  const { regenerate, github } = body as Record<string, unknown>;
  return typeof regenerate === "boolean" && typeof github === "boolean"
    ? { regenerate, github }
    : NO_FEATURES;
}

/** site.yaml's `on` and `off` decide; `auto`, or no setting, follows the API. */
export const isOn = (mode: FeatureMode | undefined, served: boolean): boolean =>
  mode === "on" || (mode !== "off" && served);
