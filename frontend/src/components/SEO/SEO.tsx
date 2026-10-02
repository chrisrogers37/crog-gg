import { Helmet } from "react-helmet-async";
import { headTags, jsonLd, pageTitle, type PageMeta } from "../../seo";

/**
 * SEO Component
 *
 * Renders a page's title, meta description, canonical, Open Graph and Twitter
 * tags, and JSON-LD, from the same builder the build prerenders them with
 * (seo/site.ts explains why they must match).
 */
export function SEO(meta: PageMeta) {
  return (
    <Helmet>
      <title>{pageTitle(meta)}</title>
      {headTags(meta).map(({ tag: Tag, attrs }) => (
        <Tag key={attrs.name ?? attrs.property ?? attrs.rel} {...attrs} />
      ))}
      {(meta.schemas ?? []).map((schema, index) => (
        <script key={index} type="application/ld+json">
          {jsonLd(schema)}
        </script>
      ))}
    </Helmet>
  );
}
