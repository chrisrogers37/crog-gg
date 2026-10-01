import { useState } from "react";
import { logoUrl } from "../../utils/logos";

type LogoImageProps = {
  domain: string | undefined;
  alt: string;
  size?: number;
  fallback?: React.ReactNode;
  className?: string;
};

/**
 * Renders a company/org logo from a domain (utils/logos.ts), with a fallback
 * when there is no domain or its logo fails to load. The width and height
 * hold the logo's footprint from first paint, so its arrival shifts nothing.
 */
export function LogoImage({
  domain,
  alt,
  size = 24,
  fallback = null,
  className = "",
}: LogoImageProps) {
  const [failedDomain, setFailedDomain] = useState<string>();

  if (!domain || failedDomain === domain) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <span
        className={`logo-image ${className}`}
        style={{ display: "inline-block", width: size, height: size }}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={logoUrl(domain)}
      alt={alt}
      width={size}
      height={size}
      className={`logo-image ${className}`}
      style={{ objectFit: "contain" }}
      onError={() => setFailedDomain(domain)}
    />
  );
}
