import { useLogo } from "../../hooks/useLogo";

type LogoImageProps = {
  domain: string | undefined;
  alt: string;
  size?: number;
  fallback?: React.ReactNode;
  className?: string;
};

/**
 * Renders a company/org logo from a domain, with a fallback when unavailable.
 * Uses the logoService to validate that the image actually loads.
 */
export function LogoImage({
  domain,
  alt,
  size = 24,
  fallback = null,
  className = "",
}: LogoImageProps) {
  const logoUrl = useLogo(domain);

  if (!logoUrl) {
    // The logo resolves asynchronously, so it must occupy its footprint before
    // it arrives -- otherwise it appears mid-read and changes the height of the
    // line it lands on. A caller that supplied a fallback has already put
    // something in the space; a caller that did not was rendering nothing at
    // all, which is the case that shifts.
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
      src={logoUrl}
      alt={alt}
      width={size}
      height={size}
      className={`logo-image ${className}`}
      style={{ objectFit: "contain" }}
    />
  );
}
