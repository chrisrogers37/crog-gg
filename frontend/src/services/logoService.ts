type LogoProvider = "clearbit" | "google";

type LogoOptions = {
  size?: number;
  provider?: LogoProvider;
};

const PROVIDER_URL: Record<
  LogoProvider,
  (domain: string, size: number) => string
> = {
  clearbit: (domain, size) =>
    `https://logo.clearbit.com/${domain}?size=${size}`,
  google: (domain, size) =>
    `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
};

const DEFAULT_PROVIDER: LogoProvider = "clearbit";
const DEFAULT_SIZE = 64;

/**
 * Logo Service
 *
 * Generates logo URLs for companies/organizations by domain.
 * Uses Clearbit's logo API by default with Google favicons as a fallback.
 * Validates that logos actually load and caches results to avoid repeated checks.
 */
class LogoService {
  private validationCache: Map<string, Promise<boolean>> = new Map();

  /**
   * Get a logo URL for a given domain.
   */
  getLogoUrl(domain: string, options?: LogoOptions): string {
    const provider = options?.provider ?? DEFAULT_PROVIDER;
    const size = options?.size ?? DEFAULT_SIZE;
    return PROVIDER_URL[provider](domain, size);
  }

  /**
   * Check if a logo URL actually resolves to a valid image.
   * Results are cached per URL to avoid redundant network requests.
   */
  async validateLogo(url: string): Promise<boolean> {
    const cached = this.validationCache.get(url);
    if (cached) return cached;

    const promise = new Promise<boolean>((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });

    this.validationCache.set(url, promise);
    return promise;
  }

  /**
   * Get a validated logo URL, falling back through providers if the primary fails.
   * Returns null if no provider can serve the logo.
   */
  async getValidatedLogoUrl(
    domain: string,
    options?: LogoOptions,
  ): Promise<string | null> {
    const size = options?.size ?? DEFAULT_SIZE;
    const preferredProvider = options?.provider ?? DEFAULT_PROVIDER;

    // Try preferred provider first
    const primaryUrl = this.getLogoUrl(domain, {
      provider: preferredProvider,
      size,
    });
    if (await this.validateLogo(primaryUrl)) {
      return primaryUrl;
    }

    // Fall back to the other provider
    const fallbackProvider: LogoProvider =
      preferredProvider === "clearbit" ? "google" : "clearbit";
    const fallbackUrl = this.getLogoUrl(domain, {
      provider: fallbackProvider,
      size,
    });
    if (await this.validateLogo(fallbackUrl)) {
      return fallbackUrl;
    }

    return null;
  }

  clearCache(): void {
    this.validationCache.clear();
  }
}

export const logoService = new LogoService();
