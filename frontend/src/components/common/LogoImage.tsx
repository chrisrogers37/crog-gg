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
    return <>{fallback}</>;
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
