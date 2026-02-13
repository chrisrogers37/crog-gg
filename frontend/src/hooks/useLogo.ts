import { useState, useEffect } from "react";
import { logoService } from "../services/logoService";

/**
 * Hook that resolves a validated logo URL for a given domain.
 * Returns the logo URL once validated, or null if unavailable.
 */
export function useLogo(domain: string | undefined): string | null {
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!domain) {
      setLogoUrl(null);
      return;
    }

    let cancelled = false;

    logoService.getValidatedLogoUrl(domain).then((url) => {
      if (!cancelled) {
        setLogoUrl(url);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [domain]);

  return logoUrl;
}
