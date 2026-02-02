import { Helmet } from 'react-helmet-async';

/**
 * Person Schema for the home page
 */
export function PersonSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: 'Chris Rogers',
    url: 'https://crog.gg',
    image: 'https://crog.gg/profile-photo.jpg',
    jobTitle: 'Builder of Things That Sometimes Work',
    sameAs: [
      'https://github.com/chrisrogers37',
      'https://linkedin.com/in/chrisrogers37',
      'https://open.spotify.com/artist/0UotSScPTiSFPmbmjam2jn',
    ],
    knowsAbout: [
      'Software Development',
      'Web Development',
      'Data Engineering',
      'Python',
      'TypeScript',
      'React',
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * SoftwareApplication Schema for project pages
 */
interface SoftwareSchemaProps {
  name: string;
  description: string;
  url: string;
  applicationCategory?: string;
  operatingSystem?: string;
}

export function SoftwareSchema({
  name,
  description,
  url,
  applicationCategory = 'WebApplication',
  operatingSystem = 'Any',
}: SoftwareSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url,
    applicationCategory,
    operatingSystem,
    author: {
      '@type': 'Person',
      name: 'Chris Rogers',
      url: 'https://crog.gg',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}

/**
 * BreadcrumbList Schema for navigation
 */
interface BreadcrumbSchemaProps {
  items: Array<{ name: string; url: string }>;
}

export function BreadcrumbSchema({ items }: BreadcrumbSchemaProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `https://crog.gg${item.url}`,
    })),
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(schema)}</script>
    </Helmet>
  );
}
