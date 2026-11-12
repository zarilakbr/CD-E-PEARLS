import { Helmet } from 'react-helmet-async';
import {
  BRAND_NAME,
  DEFAULT_LOCALE,
  DEFAULT_OG_IMAGE,
  clampDescription,
  clampTitle,
  normalizeCanonicalUrl,
  resolveAbsoluteSeoImageUrl,
} from '../../lib/seo';

export interface SeoProps {
  title: string;
  description: string;
  path: string;
  image?: string | null;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

function serializeJsonLd(node: Record<string, unknown>): string {
  return JSON.stringify(node).replace(/</g, '\\u003c');
}

export function Seo({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}: SeoProps) {
  const safeTitle = clampTitle(title);
  const safeDescription = clampDescription(description);
  const canonicalUrl = normalizeCanonicalUrl(path);
  const ogImage = image ? resolveAbsoluteSeoImageUrl(image) : DEFAULT_OG_IMAGE;
  const robotsValue = noindex ? 'noindex, nofollow' : 'index, follow';

  const jsonLdItems = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];

  return (
    <Helmet prioritizeSeoTags>
      <title>{safeTitle}</title>
      <meta name="description" content={safeDescription} />
      <meta name="robots" content={robotsValue} />
      {!noindex && <link rel="canonical" href={canonicalUrl} />}

      <meta property="og:title" content={safeTitle} />
      <meta property="og:description" content={safeDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:locale" content={DEFAULT_LOCALE} />
      <meta property="og:site_name" content={BRAND_NAME} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={safeTitle} />
      <meta name="twitter:description" content={safeDescription} />
      <meta name="twitter:image" content={ogImage} />

      {jsonLdItems.map((node, index) => (
        <script key={`ld-${index}`} type="application/ld+json">
          {serializeJsonLd(node)}
        </script>
      ))}
    </Helmet>
  );
}

