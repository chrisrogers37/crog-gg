import { useEffect } from "react";
import site from "virtual:site-config";
import { API_URL } from "../config/api";
import { NO_FEATURES, isOn, parseFeatures, type Features } from "../config/features";
import { useUIStore } from "../store/uiStore";
import { isServedOwner } from "../utils/projectLinks";

/** How long the page waits for the API's answer before showing nothing. */
const FEATURES_TIMEOUT_MS = 3000;

/**
 * What this deployment serves, from GET /api/features (#189 M21). An error
 * status, a body that isn't the answer, or no answer in time serves nothing:
 * the page hides what it can't be sure works.
 */
export async function fetchFeatures(): Promise<Features> {
  try {
    const response = await fetch(`${API_URL}/api/features`, {
      signal: AbortSignal.timeout(FEATURES_TIMEOUT_MS),
    });
    if (!response.ok) return NO_FEATURES;
    return parseFeatures(await response.json());
  } catch {
    return NO_FEATURES;
  }
}

/** Asks once, when the app starts (Layout), and stores the answer. */
export function useFeatures() {
  const setFeatures = useUIStore((state) => state.setFeatures);
  useEffect(() => {
    void fetchFeatures().then(setFeatures);
  }, [setFeatures]);
}

/**
 * Whether SUMMON shows: site.yaml's features.regenerate, else the API's
 * answer. Not before it answers: the buttons need a click first, by which
 * time it has.
 */
export function useRegenerateOn(): boolean {
  const served = useUIStore((state) => state.features?.regenerate ?? false);
  return isOn(site.features?.regenerate, served);
}

/**
 * Whether a repo's stats and README show: site.yaml's features.github, else
 * the API's answer, and only for an owner the API serves. While the answer is
 * on its way they show, as they will on a deployment that serves them, so a
 * deep link doesn't shift when it lands. No repo, nothing to show.
 */
export function useGithubOn(owner: string | undefined): boolean {
  const served = useUIStore((state) => state.features?.github ?? true);
  if (owner === undefined || !isServedOwner(site, owner)) return false;
  return isOn(site.features?.github, served);
}
