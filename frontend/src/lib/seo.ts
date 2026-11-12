export const SITE_URL = 'https://cdepearlslombok.id';
export const DEFAULT_API_ORIGIN = 'https://api.cdepearlslombok.id';
export const BRAND_NAME = "CD'E Pearls Lombok";
export const DEFAULT_LOCALE = 'id_ID';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/images/hero_pearl_dark_luxury.jpg`;
export const BRAND_LOGO_URL = `${SITE_URL}/images/cde_logo.png`;

// TODO: Verifikasi nomor telepon, email, alamat fisik galeri, dan akun media sosial resmi dengan pemilik sebelum submit Search Console.
export const STORE_CONTACT = {
  name: BRAND_NAME,
  alternateName: "CD'E Pearls & Gold",
  description:
    "Butik haute joaillerie mutiara laut selatan asli Lombok (South Sea Pearls) berbalut emas 18K dan sertifikat keaslian gemologi resmi.",
  telephone: '+62-812-3988-7766', // TODO: Pastikan nomor telepon/WhatsApp utama bisnis
  email: 'atelier@cdepearls.com', // TODO: Pastikan email resmi bisnis
  streetAddress: 'Jl. Raya Senggigi No. 88, Batu Layar', // TODO: Pastikan alamat fisik galeri Senggigi/Mataram
  addressLocality: 'Lombok Barat',
  addressRegion: 'Nusa Tenggara Barat',
  postalCode: '83355',
  addressCountry: 'ID',
  openingHours: ['Mo-Sa 09:00-18:00'], // TODO: Pastikan jam operasional galeri
  priceRange: 'Rp 2.000.000 - Rp 150.000.000',
  sameAs: [] as string[], // TODO: Tambahkan tautan Instagram/TikTok/Facebook resmi
} as const;

export interface StaticSitemapRoute {
  path: string;
  changefreq: 'daily' | 'weekly' | 'monthly' | 'yearly';
  priority: string;
}

export const PUBLIC_STATIC_ROUTES: readonly StaticSitemapRoute[] = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/katalog', changefreq: 'daily', priority: '0.9' },
  { path: '/edukasi', changefreq: 'weekly', priority: '0.7' },
  { path: '/tentang', changefreq: 'monthly', priority: '0.7' },
  { path: '/kontak', changefreq: 'monthly', priority: '0.7' },
  { path: '/studio', changefreq: 'weekly', priority: '0.6' },
  { path: '/cek-sertifikat', changefreq: 'monthly', priority: '0.6' },
  { path: '/bantuan', changefreq: 'monthly', priority: '0.5' },
  { path: '/kebijakan-privasi', changefreq: 'yearly', priority: '0.3' },
  { path: '/syarat-ketentuan', changefreq: 'yearly', priority: '0.3' },
];

export const PRERENDER_ROUTES: readonly string[] = [
  '/',
  '/katalog',
  '/edukasi',
  '/tentang',
  '/kontak',
];

export const PRIVATE_NOINDEX_PREFIXES: readonly string[] = [
  '/admin',
  '/spi',
  '/akun',
  '/checkout',
  '/masuk',
  '/daftar',
  '/login',
  '/register',
  '/lupa-kata-sandi',
  '/atur-ulang-kata-sandi',
  '/verifikasi-email',
  '/auth',
  '/keranjang',
  '/favorit',
  '/lacak-pesanan',
  '/403',
  '/404',
  '/500',
];

export const ROBOTS_TXT_LINES: readonly string[] = [
  'User-agent: *',
  'Allow: /',
  'Disallow: /admin',
  'Disallow: /spi',
  'Disallow: /akun',
  'Disallow: /checkout',
  'Disallow: /login',
  'Disallow: /register',
  'Disallow: /masuk',
  'Disallow: /daftar',
  'Disallow: /keranjang',
  'Disallow: /favorit',
  'Disallow: /lupa-kata-sandi',
  'Disallow: /atur-ulang-kata-sandi',
  'Disallow: /verifikasi-email',
  'Disallow: /auth/',
  'Disallow: /api',
  `Sitemap: ${SITE_URL}/sitemap.xml`,
];

export const ROBOTS_TXT_CONTENT = `${ROBOTS_TXT_LINES.join('\n')}\n`;

export interface SeoCategoryInput {
  name?: string | null;
  slug?: string | null;
}

export interface SeoProductInput {
  id: number | string;
  code?: string | null;
  name: string;
  description?: string | null;
  price?: number | string | null;
  stock?: number | string | null;
  varietas?: string | null;
  grade?: string | null;
  logam?: string | null;
  ukuran_mm?: string | null;
  status?: string | null;
  image?: string | null;
  images?: Array<string | { url?: string | null; image_url?: string | null }> | null;
  category?: SeoCategoryInput | string | null;
  category_slug?: string | null;
  rating?: number | string | null;
  reviews_count?: number | string | null;
  reviews?: Array<unknown> | null;
  updated_at?: string | null;
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export interface ProductSeoMeta {
  title: string;
  description: string;
  canonicalPath: string;
  canonicalUrl: string;
  image: string;
  jsonLd: Record<string, unknown>[];
}

export function normalizePath(rawPath: string): string {
  const withoutHash = rawPath.split('#')[0] || '/';
  const withoutQuery = withoutHash.split('?')[0] || '/';
  const withLeadingSlash = withoutQuery.startsWith('/') ? withoutQuery : `/${withoutQuery}`;
  if (withLeadingSlash.length > 1 && withLeadingSlash.endsWith('/')) {
    return withLeadingSlash.slice(0, -1);
  }
  return withLeadingSlash || '/';
}

export function normalizeCanonicalUrl(path: string): string {
  const clean = normalizePath(path);
  return clean === '/' ? `${SITE_URL}/` : `${SITE_URL}${clean}`;
}

export function isPrivateNoindexPath(pathname: string): boolean {
  const clean = normalizePath(pathname).toLowerCase();
  return PRIVATE_NOINDEX_PREFIXES.some(
    (prefix) => clean === prefix || clean.startsWith(`${prefix}/`),
  );
}

export function clampTitle(rawTitle: string, maxLen = 60): string {
  const clean = rawTitle.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const slice = clean.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = lastSpace > Math.floor(maxLen * 0.6) ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

export function clampDescription(rawDesc: string, maxLen = 160): string {
  const clean = rawDesc.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;
  const slice = clean.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(' ');
  const trimmed = lastSpace > Math.floor(maxLen * 0.65) ? slice.slice(0, lastSpace) : slice;
  return `${trimmed.trimEnd()}…`;
}

export function resolveAbsoluteSeoImageUrl(
  rawUrl?: string | null,
  apiOrigin: string = DEFAULT_API_ORIGIN,
): string {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return DEFAULT_OG_IMAGE;
  }
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return DEFAULT_OG_IMAGE;
  }
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return DEFAULT_OG_IMAGE;
  }
  if (trimmed.startsWith('/storage') || trimmed.startsWith('storage/')) {
    const cleanOrigin = apiOrigin.replace(/\/api(\/v1)?\/?$/i, '').replace(/\/+$/, '');
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${cleanOrigin}${cleanPath}`;
  }
  if (trimmed.startsWith('/')) {
    return `${SITE_URL}${trimmed}`;
  }
  return `${SITE_URL}/${trimmed}`;
}

export function resolveProductCategoryName(product: Pick<SeoProductInput, 'category' | 'category_slug'>): string {
  if (product.category && typeof product.category === 'object' && product.category.name) {
    return product.category.name;
  }
  if (typeof product.category === 'string' && product.category.trim()) {
    return product.category.trim();
  }
  if (product.category_slug && product.category_slug.trim()) {
    return product.category_slug
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return 'Perhiasan Mutiara';
}

export function collectProductImages(
  product: Pick<SeoProductInput, 'image' | 'images'>,
  apiOrigin: string = DEFAULT_API_ORIGIN,
): string[] {
  const urls: string[] = [];
  const pushIfValid = (candidate?: string | null) => {
    if (!candidate || typeof candidate !== 'string') return;
    const resolved = resolveAbsoluteSeoImageUrl(candidate, apiOrigin);
    if (resolved && !urls.includes(resolved)) {
      urls.push(resolved);
    }
  };

  pushIfValid(product.image);
  if (Array.isArray(product.images)) {
    for (const entry of product.images) {
      if (typeof entry === 'string') {
        pushIfValid(entry);
      } else if (entry && typeof entry === 'object') {
        pushIfValid(entry.url || entry.image_url || null);
      }
    }
  }

  return urls.length > 0 ? urls : [DEFAULT_OG_IMAGE];
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  const node: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: STORE_CONTACT.name,
    alternateName: STORE_CONTACT.alternateName,
    url: `${SITE_URL}/`,
    logo: BRAND_LOGO_URL,
    image: DEFAULT_OG_IMAGE,
    description: STORE_CONTACT.description,
    email: STORE_CONTACT.email,
    telephone: STORE_CONTACT.telephone,
  };
  if (STORE_CONTACT.sameAs.length > 0) {
    node.sameAs = [...STORE_CONTACT.sameAs];
  }
  return node;
}

export function buildLocalBusinessJsonLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#localbusiness`,
    name: STORE_CONTACT.name,
    url: `${SITE_URL}/`,
    image: DEFAULT_OG_IMAGE,
    logo: BRAND_LOGO_URL,
    description: STORE_CONTACT.description,
    telephone: STORE_CONTACT.telephone,
    email: STORE_CONTACT.email,
    priceRange: STORE_CONTACT.priceRange,
    openingHours: [...STORE_CONTACT.openingHours],
    address: {
      '@type': 'PostalAddress',
      streetAddress: STORE_CONTACT.streetAddress,
      addressLocality: STORE_CONTACT.addressLocality,
      addressRegion: STORE_CONTACT.addressRegion,
      postalCode: STORE_CONTACT.postalCode,
      addressCountry: STORE_CONTACT.addressCountry,
    },
    parentOrganization: {
      '@id': `${SITE_URL}/#organization`,
    },
  };
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: item.name,
      item: normalizeCanonicalUrl(item.path),
    })),
  };
}

export function hasRealProductReviews(
  product: Pick<SeoProductInput, 'rating' | 'reviews_count' | 'reviews'>,
): boolean {
  const reviewsArrayCount = Array.isArray(product.reviews) ? product.reviews.length : 0;
  const reportedCount = Number(product.reviews_count ?? 0);
  const effectiveCount = Math.max(reviewsArrayCount, Number.isFinite(reportedCount) ? reportedCount : 0);
  const numericRating = Number(product.rating ?? 0);
  return effectiveCount > 0 && Number.isFinite(numericRating) && numericRating > 0 && numericRating <= 5;
}

export function buildProductJsonLd(
  product: SeoProductInput,
  canonicalPath?: string,
  apiOrigin: string = DEFAULT_API_ORIGIN,
): Record<string, unknown> {
  const path = canonicalPath ? normalizePath(canonicalPath) : `/produk/${product.id}`;
  const canonicalUrl = normalizeCanonicalUrl(path);
  const numericPrice = Math.max(0, Number(product.price ?? 0) || 0);
  const numericStock = Number(product.stock ?? 0);
  const inStock = Number.isFinite(numericStock) && numericStock > 0;
  const images = collectProductImages(product, apiOrigin);
  const categoryName = resolveProductCategoryName(product);

  const summaryParts = [
    product.varietas,
    product.grade ? `Grade ${product.grade}` : null,
    product.ukuran_mm ? `${product.ukuran_mm} mm` : null,
    product.logam,
  ].filter(Boolean);

  const description = clampDescription(
    product.description?.trim() ||
      `${product.name} — ${categoryName} ${summaryParts.join(', ')} bersertifikat keaslian dari ${BRAND_NAME}.`,
  );

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: images,
    description,
    sku: product.code?.trim() || String(product.id),
    category: categoryName,
    brand: {
      '@type': 'Brand',
      name: BRAND_NAME,
    },
    offers: {
      '@type': 'Offer',
      url: canonicalUrl,
      priceCurrency: 'IDR',
      price: numericPrice,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: BRAND_NAME,
      },
    },
  };

  if (hasRealProductReviews(product)) {
    const reviewsArrayCount = Array.isArray(product.reviews) ? product.reviews.length : 0;
    const reportedCount = Number(product.reviews_count ?? 0);
    const reviewCount = Math.max(reviewsArrayCount, Number.isFinite(reportedCount) ? reportedCount : 0);
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(Number(product.rating).toFixed(2)),
      reviewCount,
    };
  }

  return schema;
}

export function buildProductSeoMeta(
  product: SeoProductInput,
  fallbackPath?: string,
  apiOrigin: string = DEFAULT_API_ORIGIN,
): ProductSeoMeta {
  const canonicalPath = product.id ? `/produk/${product.id}` : normalizePath(fallbackPath || '/katalog');
  const canonicalUrl = normalizeCanonicalUrl(canonicalPath);
  const categoryName = resolveProductCategoryName(product);
  const images = collectProductImages(product, apiOrigin);

  const titleCandidate = `${product.name} | ${BRAND_NAME}`;
  const title =
    titleCandidate.length <= 60
      ? titleCandidate
      : clampTitle(`${product.name} — CD'E Pearls`, 60);

  const detailSpecs = [
    product.varietas,
    product.grade ? `Grade ${product.grade}` : null,
    product.ukuran_mm ? `${product.ukuran_mm} mm` : null,
    product.logam,
  ]
    .filter(Boolean)
    .join(' · ');

  const rawDesc =
    product.description && product.description.trim().length > 20
      ? `${product.name}: ${product.description.trim()}`
      : `${product.name} (${categoryName})${detailSpecs ? ` — ${detailSpecs}` : ''}. Mutiara laut asli Lombok bersertifikat gemologi resmi dari ${BRAND_NAME}.`;

  const description = clampDescription(rawDesc, 160);

  const breadcrumbs: BreadcrumbItem[] = [
    { name: 'Beranda', path: '/' },
    { name: 'Katalog', path: '/katalog' },
    { name: product.name, path: canonicalPath },
  ];

  return {
    title,
    description,
    canonicalPath,
    canonicalUrl,
    image: images[0],
    jsonLd: [
      buildProductJsonLd(product, canonicalPath, apiOrigin),
      buildBreadcrumbJsonLd(breadcrumbs),
    ],
  };
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toValidLastmod(rawDate?: string | null, fallbackDate?: string): string {
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }
  }
  return fallbackDate || new Date().toISOString().split('T')[0];
}

export interface SitemapProductEntry {
  id: number | string;
  code?: string | null;
  status?: string | null;
  updated_at?: string | null;
}

const PUBLISHABLE_PRODUCT_STATUSES = new Set(['active', 'published']);

export function isPublishableProductStatus(status?: string | null): boolean {
  if (!status) return true;
  return PUBLISHABLE_PRODUCT_STATUSES.has(status.trim().toLowerCase());
}

export function buildSitemapXml(
  products: SitemapProductEntry[],
  options?: { today?: string },
): string {
  const today = options?.today || new Date().toISOString().split('T')[0];
  const entries: string[] = [];

  for (const route of PUBLIC_STATIC_ROUTES) {
    const loc = normalizeCanonicalUrl(route.path);
    entries.push(
      [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${escapeXml(today)}</lastmod>`,
        `    <changefreq>${route.changefreq}</changefreq>`,
        `    <priority>${route.priority}</priority>`,
        '  </url>',
      ].join('\n'),
    );
  }

  const seenProductPaths = new Set<string>();
  for (const prod of products) {
    if (!prod || prod.id === undefined || prod.id === null) continue;
    if (!isPublishableProductStatus(prod.status)) continue;
    const productPath = `/produk/${prod.id}`;
    if (seenProductPaths.has(productPath)) continue;
    seenProductPaths.add(productPath);

    const loc = normalizeCanonicalUrl(productPath);
    const lastmod = toValidLastmod(prod.updated_at, today);
    entries.push(
      [
        '  <url>',
        `    <loc>${escapeXml(loc)}</loc>`,
        `    <lastmod>${escapeXml(lastmod)}</lastmod>`,
        '    <changefreq>weekly</changefreq>',
        '    <priority>0.8</priority>',
        '  </url>',
      ].join('\n'),
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join('\n');
}
