import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "profile";
  noIndex?: boolean;
}

const SITE_NAME = "Chris Rogers - builder of things that are sometimes cool";
const DEFAULT_DESCRIPTION =
  "Builder, data engineer, and music maker. Building web apps, data tools, and making noise.";
const DEFAULT_IMAGE = "https://crog.gg/og-image.png";
const BASE_URL = "https://crog.gg";

/**
 * SEO Component
 *
 * Manages document head for SEO and social sharing.
 * Includes meta tags, Open Graph, and Twitter Cards.
 */
export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = "",
  type = "website",
  noIndex = false,
}: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = `${BASE_URL}${url}`;
  const fullImage = image.startsWith("http") ? image : `${BASE_URL}${image}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullUrl} />

      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {/* Open Graph */}
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImage} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content={SITE_NAME} />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImage} />
    </Helmet>
  );
}
