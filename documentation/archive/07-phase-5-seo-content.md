# 07 - Phase 5: SEO & Content

## Overview

**Goal**: Optimize the portfolio for search engines, social sharing, and content discoverability.

**Estimated Effort**: 13 story points

**Prerequisites**:

- Phase 3 completed (routing in place)
- Can run in parallel with Phase 4

**Deliverables**:

1. Meta tags and OG images
2. Structured data (JSON-LD)
3. Sitemap generation
4. Analytics integration
5. Performance optimization
6. Accessibility improvements

---

## Table of Contents

1. [Task 5.1: Install React Helmet](#task-51-install-react-helmet)
2. [Task 5.2: Create SEO Component](#task-52-create-seo-component)
3. [Task 5.3: Add Open Graph Tags](#task-53-add-open-graph-tags)
4. [Task 5.4: Add Structured Data](#task-54-add-structured-data)
5. [Task 5.5: Generate Sitemap](#task-55-generate-sitemap)
6. [Task 5.6: Add Analytics](#task-56-add-analytics)
7. [Task 5.7: Performance Optimization](#task-57-performance-optimization)
8. [Task 5.8: Accessibility Audit](#task-58-accessibility-audit)
9. [Verification Checklist](#verification-checklist)

---

## Task 5.1: Install React Helmet

### What We're Doing

Adding React Helmet for dynamic document head management.

### Installation

```bash
npm install react-helmet-async
```

### Setup Provider: `frontend/src/main.tsx`

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';

// Theme initialization
function initializeTheme() {
  // ... (from Phase 4)
}

initializeTheme();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
```

---

## Task 5.2: Create SEO Component

### What We're Doing

Creating a reusable SEO component for managing page metadata.

### Create File: `frontend/src/components/SEO/SEO.tsx`

```typescript
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile';
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
    tags?: string[];
  };
  noIndex?: boolean;
}

const SITE_NAME = 'Chris Rogers - Software Engineer';
const DEFAULT_DESCRIPTION = 'Software engineer and creator building web applications, data tools, and making music.';
const DEFAULT_IMAGE = 'https://crog.gg/og-image.png';
const BASE_URL = 'https://crog.gg';

/**
 * SEO Component
 *
 * Manages document head for SEO and social sharing.
 * Includes meta tags, Open Graph, and Twitter Cards.
 *
 * @example
 * <SEO
 *   title="Projects"
 *   description="Explore my software projects"
 *   url="/projects"
 * />
 */
export function SEO({
  title,
  description = DEFAULT_DESCRIPTION,
  image = DEFAULT_IMAGE,
  url = '',
  type = 'website',
  article,
  noIndex = false,
}: SEOProps) {
  const pageTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const fullUrl = `${BASE_URL}${url}`;
  const fullImage = image.startsWith('http') ? image : `${BASE_URL}${image}`;

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

      {/* Article-specific (for blog posts, if added later) */}
      {article?.publishedTime && (
        <meta property="article:published_time" content={article.publishedTime} />
      )}
      {article?.modifiedTime && (
        <meta property="article:modified_time" content={article.modifiedTime} />
      )}
      {article?.author && (
        <meta property="article:author" content={article.author} />
      )}
      {article?.tags?.map((tag, index) => (
        <meta key={index} property="article:tag" content={tag} />
      ))}
    </Helmet>
  );
}
```

### Create Index: `frontend/src/components/SEO/index.ts`

```typescript
export { SEO } from "./SEO";
```

---

## Task 5.3: Add Open Graph Tags

### What We're Doing

Adding OG tags to each page for better social media sharing.

### Update HomePage

```typescript
// frontend/src/pages/Home/HomePage.tsx
import { SEO } from '../../components/SEO';

export function HomePage() {
  return (
    <>
      <SEO
        title={null}  // Use default site name
        description="Software engineer and creator. Explore my portfolio, projects, and music."
        url="/"
        type="profile"
      />
      {/* Rest of component */}
    </>
  );
}
```

### Update ProjectsPage

```typescript
// frontend/src/pages/Projects/ProjectsPage.tsx
import { SEO } from '../../components/SEO';

export function ProjectsPage() {
  return (
    <>
      <SEO
        title="Projects"
        description="A collection of software projects, experiments, and side projects."
        url="/projects"
      />
      {/* Rest of component */}
    </>
  );
}
```

### Update ProjectDetailPage

```typescript
// frontend/src/pages/Projects/ProjectDetailPage.tsx
import { SEO } from '../../components/SEO';

export function ProjectDetailPage() {
  const { slug } = useParams();
  const project = projects.find(p => p.id === slug);

  if (!project) {
    return (
      <>
        <SEO title="Project Not Found" noIndex />
        {/* 404 content */}
      </>
    );
  }

  return (
    <>
      <SEO
        title={project.title}
        description={project.description}
        url={`/projects/${project.id}`}
        image={project.image}  // If projects have images
      />
      {/* Rest of component */}
    </>
  );
}
```

### Create OG Image

Create a default OG image at `frontend/public/og-image.png`:

- Dimensions: 1200x630px
- Include name, title, and visual branding
- Use tools like Figma or Canva

---

## Task 5.4: Add Structured Data

### What We're Doing

Adding JSON-LD structured data for rich search results.

### Create File: `frontend/src/components/SEO/StructuredData.tsx`

```typescript
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
    image: 'https://crog.gg/headshot.png',
    jobTitle: 'Software Engineer',
    sameAs: [
      'https://github.com/chrisrogers37',
      'https://linkedin.com/in/chrisrogers37',
      'https://open.spotify.com/artist/YOUR_ID',
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
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
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
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
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
      <script type="application/ld+json">
        {JSON.stringify(schema)}
      </script>
    </Helmet>
  );
}
```

---

## Task 5.5: Generate Sitemap

### What We're Doing

Creating a sitemap for search engine crawling.

### Create Static Sitemap: `frontend/public/sitemap.xml`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://crog.gg/</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://crog.gg/projects</loc>
    <lastmod>2026-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Add project URLs dynamically in build process -->
</urlset>
```

### Create Robots.txt: `frontend/public/robots.txt`

```
User-agent: *
Allow: /

Sitemap: https://crog.gg/sitemap.xml
```

### Dynamic Sitemap Generation (Build Script)

Create a build script to generate sitemap from projects:

```typescript
// scripts/generate-sitemap.ts
import fs from "fs";
import path from "path";
import yaml from "js-yaml";

interface Project {
  id: string;
}

interface ProjectIndex {
  projects: string[];
}

async function generateSitemap() {
  const baseUrl = "https://crog.gg";
  const today = new Date().toISOString().split("T")[0];

  // Load projects
  const indexPath = path.join(__dirname, "../src/content/projects/index.yaml");
  const indexContent = fs.readFileSync(indexPath, "utf-8");
  const index = yaml.load(indexContent) as ProjectIndex;

  const projectUrls = index.projects.map((filename) => {
    const id = filename.replace(".yaml", "");
    return `
  <url>
    <loc>${baseUrl}/projects/${id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/projects</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>${projectUrls.join("")}
</urlset>`;

  fs.writeFileSync(path.join(__dirname, "../public/sitemap.xml"), sitemap);
  console.log("✓ Sitemap generated");
}

generateSitemap();
```

Add to package.json:

```json
{
  "scripts": {
    "build": "npm run generate-sitemap && tsc && vite build",
    "generate-sitemap": "ts-node scripts/generate-sitemap.ts"
  }
}
```

---

## Task 5.6: Add Analytics

### What We're Doing

Adding privacy-friendly analytics to track visitor behavior.

### Option A: Plausible Analytics (Recommended - Privacy-Friendly)

Add to `frontend/index.html`:

```html
<head>
  <!-- Plausible Analytics -->
  <script
    defer
    data-domain="crog.gg"
    src="https://plausible.io/js/script.js"
  ></script>
</head>
```

### Option B: Google Analytics 4

```html
<head>
  <!-- Google Analytics -->
  <script
    async
    src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"
  ></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      dataLayer.push(arguments);
    }
    gtag("js", new Date());
    gtag("config", "G-XXXXXXXXXX");
  </script>
</head>
```

### Track Page Views in SPA

Create analytics hook: `frontend/src/hooks/useAnalytics.ts`

```typescript
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Track page views on route changes.
 * Works with Plausible or GA4.
 */
export function usePageTracking() {
  const location = useLocation();

  useEffect(() => {
    // Plausible
    if (window.plausible) {
      window.plausible("pageview");
    }

    // GA4
    if (window.gtag) {
      window.gtag("event", "page_view", {
        page_path: location.pathname,
      });
    }
  }, [location]);
}

// Add to window type
declare global {
  interface Window {
    plausible?: (event: string, options?: object) => void;
    gtag?: (...args: unknown[]) => void;
  }
}
```

Use in Layout:

```typescript
// frontend/src/components/layout/Layout/Layout.tsx
import { usePageTracking } from "../../../hooks/useAnalytics";

export function Layout() {
  usePageTracking();
  // ...
}
```

---

## Task 5.7: Performance Optimization

### What We're Doing

Optimizing loading performance for better SEO and user experience.

### Image Optimization

1. **Convert images to WebP**:

   ```bash
   # Install cwebp
   brew install webp  # macOS

   # Convert images
   cwebp -q 85 public/headshot.png -o public/headshot.webp
   ```

2. **Use responsive images**:

   ```typescript
   <picture>
     <source srcSet="/headshot.webp" type="image/webp" />
     <source srcSet="/headshot.png" type="image/png" />
     <img src="/headshot.png" alt="Chris Rogers" />
   </picture>
   ```

3. **Add lazy loading**:
   ```typescript
   <img src="/image.png" alt="..." loading="lazy" />
   ```

### Code Splitting

React Router already handles route-based code splitting. Add component-level splitting:

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const GitHubStats = lazy(() => import('./GitHubStats'));
const SpotifyEmbed = lazy(() => import('./SpotifyEmbed'));

function Projects() {
  return (
    <Suspense fallback={<Loading />}>
      <GitHubStats />
    </Suspense>
  );
}
```

### Preload Critical Assets

Add to `frontend/index.html`:

```html
<head>
  <!-- Preload critical assets -->
  <link rel="preload" href="/headshot.webp" as="image" type="image/webp" />
  <link
    rel="preload"
    href="/fonts/inter.woff2"
    as="font"
    type="font/woff2"
    crossorigin
  />

  <!-- Prefetch next likely page -->
  <link rel="prefetch" href="/projects" />
</head>
```

### Vite Build Optimization

Update `frontend/vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          animations: ["framer-motion"],
        },
      },
    },
    // Minification
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
```

---

## Task 5.8: Accessibility Audit

### What We're Doing

Ensuring the site is accessible to all users.

### Accessibility Checklist

- [ ] **All images have alt text**
- [ ] **Color contrast passes WCAG AA** (use contrast checker)
- [ ] **Focus indicators visible** on all interactive elements
- [ ] **Keyboard navigation** works throughout site
- [ ] **Skip to content** link at top of page
- [ ] **Headings are hierarchical** (h1 → h2 → h3)
- [ ] **Form inputs have labels**
- [ ] **ARIA labels** on icon-only buttons
- [ ] **Reduced motion** preference respected

### Add Skip Link

```typescript
// frontend/src/components/layout/Layout/Layout.tsx

export function Layout() {
  return (
    <div className="layout">
      {/* Skip to main content link */}
      <a
        href="#main-content"
        className="
          sr-only focus:not-sr-only
          focus:absolute focus:top-4 focus:left-4
          focus:z-50 focus:px-4 focus:py-2
          focus:bg-primary-600 focus:text-white
          focus:rounded-md
        "
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="layout-main">
        <AnimatedRoutes />
      </main>

      <Footer />
    </div>
  );
}
```

### Respect Reduced Motion

```typescript
// In animation components
import { motion } from "framer-motion";

const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

// Use reduced motion variants
const variants = prefersReducedMotion
  ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } // No movement
  : { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };
```

Or globally in Framer Motion:

```typescript
// frontend/src/main.tsx
import { MotionConfig } from 'framer-motion';

<MotionConfig reducedMotion="user">
  <App />
</MotionConfig>
```

---

## Verification Checklist

### SEO Tests

- [ ] **Meta tags render**: Check view-source for title, description
- [ ] **OG tags work**: Use Facebook Sharing Debugger
- [ ] **Twitter cards work**: Use Twitter Card Validator
- [ ] **Structured data valid**: Use Google Rich Results Test
- [ ] **Sitemap accessible**: Visit /sitemap.xml
- [ ] **Robots.txt correct**: Visit /robots.txt

### Performance Tests

- [ ] **Lighthouse score > 90**: Run Chrome Lighthouse audit
- [ ] **Core Web Vitals pass**: Check in PageSpeed Insights
- [ ] **Images optimized**: WebP format, lazy loading
- [ ] **JS bundle < 200KB**: Check build output

### Accessibility Tests

- [ ] **Lighthouse a11y > 95**: Run accessibility audit
- [ ] **Keyboard navigation**: Tab through entire site
- [ ] **Screen reader test**: Use VoiceOver/NVDA
- [ ] **Color contrast**: All text passes AA

---

## Common Issues

### Issue: OG image not showing on social media

**Cause**: Image URL not absolute or wrong dimensions.

**Solution**:

- Use absolute URL: `https://crog.gg/og-image.png`
- Ensure dimensions are 1200x630px
- Clear cache in social media debuggers

### Issue: Structured data validation errors

**Cause**: Missing required properties.

**Solution**: Use Google's Rich Results Test to identify missing fields.

### Issue: Lighthouse performance score low

**Cause**: Large bundle, unoptimized images, render-blocking resources.

**Solution**:

- Enable code splitting
- Convert images to WebP
- Defer non-critical JS

---

## Next Steps

After completing Phase 5:

1. **Commit your changes**:

   ```bash
   git add .
   git commit -m "Phase 5: SEO optimization and accessibility improvements"
   ```

2. **Proceed to Phase 6**: [08-phase-6-github-integration.md](./08-phase-6-github-integration.md)

---

_Document Version: 1.0.0_
_Last Updated: January 2026_
