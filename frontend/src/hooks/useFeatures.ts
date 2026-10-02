import { useEffect } from "react";
import site from "virtual:site-config";
import { API_URL } from "../config/api";
import { NO_FEATURES, isOn, parseFeatures, type Features } from "../config/features";
import { useUIStore } from "../store/uiStore";

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
    let current = true;
    void fetchFeatures().then((features) => {
      if (current) setFeatures(features);
    });
    return () => {
      current = false;
    };
  }, [setFeatures]);
}

/** Whether SUMMON shows: site.yaml's features.regenerate, else the API's answer. */
export function useRegenerateOn(): boolean {
  const served = useUIStore((state) => state.features.regenerate);
  return isOn(site.features?.regenerate, served);
}

/** The owners whose public repos the API serves, as site.yaml names them. */
const SERVED_OWNERS = new Set(
  [site.github.username, ...(site.github.allowed_owners ?? [])].map((name) => name.toLowerCase()),
);

/**
 * Whether a repo's stats and README show: site.yaml's features.github, else
 * the API's answer, and only for an owner the API serves (any other gets its
 * 404). No repo, nothing to show.
 */
export function useGithubOn(owner: string | undefined): boolean {
  const served = useUIStore((state) => state.features.github);
  if (owner === undefined || !SERVED_OWNERS.has(owner.toLowerCase())) return false;
  return isOn(site.features?.github, served);
}
