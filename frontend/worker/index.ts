import {
  BRAND_NAME,
  DEFAULT_LOCALE,
  ROBOTS_TXT_CONTENT,
  SITE_URL,
  buildProductSeoMeta,
  buildSitemapXml,
  isPrivateNoindexPath,
  isPublishableProductStatus,
  normalizePath,
  type SeoProductInput,
  type SitemapProductEntry,
} from '../src/lib/seo';

export interface Env {
  ASSETS: Fetcher;
  API_BASE_URL?: string;
}

const API_TIMEOUT_MS = 3000;
const EDGE_CACHE_TTL_SECONDS = 300;
const MAX_SITEMAP_PAGES = 10;

const STATIC_FILE_EXT_RE =
  /\.(?:js|mjs|css|map|png|jpe?g|webp|gif|svg|ico|woff2?|ttf|eot|json|txt|xml|pdf|mp4|webm)$/i;

function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function getDefaultCache(): Cache | null {
  if (typeof caches !== 'undefined' && 'default' in caches) {
    return (caches as unknown as { default: Cache }).default;
  }
  return null;
}

async function fetchJsonWithTimeout<T>(
  url: string,
  timeoutMs: number = API_TIMEOUT_MS,
): Promise<{ status: number; data: T | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      return { status: res.status, data: null };
    }
    const json = (await res.json()) as T;
    return { status: res.status, data: json };
  } catch {
    return { status: 0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

interface PaginatedProductsApiResponse {
  success?: boolean;
  current_page?: number;
  last_page?: number;
  data?: SitemapProductEntry[];
}

async function fetchActiveProductsForSitemap(apiBaseUrl: string): Promise<{
  ok: boolean;
  products: SitemapProductEntry[];
}> {
  const allProducts: SitemapProductEntry[] = [];
  let currentPage = 1;
  let lastPage = 1;

  while (currentPage <= lastPage && currentPage <= MAX_SITEMAP_PAGES) {
    const endpoint = `${apiBaseUrl}/products?per_page=100&page=${currentPage}`;
    const { status, data } = await fetchJsonWithTimeout<PaginatedProductsApiResponse>(endpoint);
    if (status !== 200 || !data || !Array.isArray(data.data)) {
      return {
        ok: currentPage > 1 && allProducts.length > 0,
        products: allProducts,
      };
    }

    allProducts.push(...data.data);
    lastPage = Math.max(1, Number(data.last_page ?? 1) || 1);
    currentPage += 1;
  }

  return {
    ok: true,
    products: allProducts,
  };
}

interface SingleProductApiResponse {
  success?: boolean;
  data?: SeoProductInput;
}

async function fetchSingleProductWithCache(
  apiBaseUrl: string,
  productIdOrCode: string,
  ctx: ExecutionContext,
): Promise<{ status: number; product: SeoProductInput | null }> {
  const endpoint = `${apiBaseUrl}/products/${encodeURIComponent(productIdOrCode)}`;
  const cache = getDefaultCache();
  const cacheKey = new Request(endpoint, { method: 'GET' });

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      try {
        const cachedPayload = (await cached.json()) as {
          status: number;
          product: SeoProductInput | null;
        };
        if (cachedPayload && cachedPayload.product) {
          return cachedPayload;
        }
      } catch {
        // Ignore corrupted cache entry
      }
    }
  }

  const { status, data } = await fetchJsonWithTimeout<SingleProductApiResponse | SeoProductInput>(
    endpoint,
  );
  const product =
    data && typeof data === 'object' && 'data' in data && data.data
      ? data.data
      : data && typeof data === 'object' && 'id' in data
      ? (data as SeoProductInput)
      : null;

  if (cache && status === 200 && product) {
    const cacheResponse = new Response(JSON.stringify({ status, product }), {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': `public, max-age=${EDGE_CACHE_TTL_SECONDS}`,
      },
    });
    ctx.waitUntil(cache.put(cacheKey, cacheResponse));
  }

  return { status, product };
}

async function fetchSpaShell(env: Env, origin: string): Promise<Response> {
  const spaRequest = new Request(`${origin}/_spa.html`, { method: 'GET' });
  const spaRes = await env.ASSETS.fetch(spaRequest);
  if (spaRes.ok) {
    return spaRes;
  }
  const indexRes = await env.ASSETS.fetch(new Request(`${origin}/index.html`, { method: 'GET' }));
  return indexRes;
}

function buildProductHeadInjectionHtml(meta: ReturnType<typeof buildProductSeoMeta>): string {
  const tags: string[] = [
    `<link rel="canonical" href="${escapeHtmlAttr(meta.canonicalUrl)}" data-rh="true" />`,
    `<meta property="og:title" content="${escapeHtmlAttr(meta.title)}" data-rh="true" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(meta.description)}" data-rh="true" />`,
    `<meta property="og:image" content="${escapeHtmlAttr(meta.image)}" data-rh="true" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(meta.canonicalUrl)}" data-rh="true" />`,
    `<meta property="og:type" content="product" data-rh="true" />`,
    `<meta property="og:locale" content="${escapeHtmlAttr(DEFAULT_LOCALE)}" data-rh="true" />`,
    `<meta property="og:site_name" content="${escapeHtmlAttr(BRAND_NAME)}" data-rh="true" />`,
    `<meta name="twitter:card" content="summary_large_image" data-rh="true" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(meta.title)}" data-rh="true" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(meta.description)}" data-rh="true" />`,
    `<meta name="twitter:image" content="${escapeHtmlAttr(meta.image)}" data-rh="true" />`,
  ];

  for (const node of meta.jsonLd) {
    const safeJson = JSON.stringify(node).replace(/</g, '\\u003c');
    tags.push(`<script type="application/ld+json" data-rh="true">${safeJson}</script>`);
  }

  return `\n    ${tags.join('\n    ')}\n  `;
}

function rewriteHtmlWithRobotsNoindex(baseHtmlRes: Response): Response {
  let sawRobotsMeta = false;
  const rewriter = new HTMLRewriter()
    .on('meta[name="robots"]', {
      element(el) {
        sawRobotsMeta = true;
        el.setAttribute('content', 'noindex, nofollow');
        el.setAttribute('data-rh', 'true');
      },
    })
    .on('head', {
      element(el) {
        el.onEndTag((endTag) => {
          if (!sawRobotsMeta) {
            endTag.before('<meta name="robots" content="noindex, nofollow" data-rh="true" />', {
              html: true,
            });
          }
        });
      },
    });

  const rewritten = rewriter.transform(baseHtmlRes);
  const headers = new Headers(rewritten.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  headers.set('Cache-Control', 'private, no-store');
  return new Response(rewritten.body, {
    status: 200,
    headers,
  });
}

function rewriteHtmlForProduct(
  baseHtmlRes: Response,
  meta: ReturnType<typeof buildProductSeoMeta>,
  apiOrigin: string,
): Response {
  const injectionHtml = buildProductHeadInjectionHtml(meta);
  const rewriter = new HTMLRewriter()
    .on('title', {
      element(el) {
        el.setInnerContent(meta.title);
      },
    })
    .on('meta[name="description"]', {
      element(el) {
        el.setAttribute('content', meta.description);
        el.setAttribute('data-rh', 'true');
      },
    })
    .on('meta[name="robots"]', {
      element(el) {
        el.setAttribute('content', 'index, follow');
        el.setAttribute('data-rh', 'true');
      },
    })
    .on('head', {
      element(el) {
        el.append(injectionHtml, { html: true });
      },
    });

  const rewritten = rewriter.transform(baseHtmlRes);
  const headers = new Headers(rewritten.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  headers.set('Cache-Control', `public, max-age=${EDGE_CACHE_TTL_SECONDS}`);
  headers.set('X-SEO-Edge', `product; api=${apiOrigin}`);
  return new Response(rewritten.body, {
    status: 200,
    headers,
  });
}

function rewriteHtmlWithCanonical(baseHtmlRes: Response, canonicalPath: string): Response {
  const canonicalUrl = `${SITE_URL}${canonicalPath === '/' ? '/' : canonicalPath}`;
  const rewriter = new HTMLRewriter().on('head', {
    element(el) {
      el.append(
        `\n    <link rel="canonical" href="${escapeHtmlAttr(canonicalUrl)}" data-rh="true" />\n  `,
        { html: true },
      );
    },
  });
  const rewritten = rewriter.transform(baseHtmlRes);
  const headers = new Headers(rewritten.headers);
  headers.set('Content-Type', 'text/html; charset=utf-8');
  return new Response(rewritten.body, {
    status: 200,
    headers,
  });
}

async function handleSitemapRequest(
  request: Request,
  ctx: ExecutionContext,
  apiBaseUrl: string,
): Promise<Response> {
  const cache = getDefaultCache();
  const cacheKey = new Request(new URL('/__seo_sitemap_cache_v1', request.url).toString(), {
    method: 'GET',
  });

  if (cache) {
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }
  }

  const { ok, products } = await fetchActiveProductsForSitemap(apiBaseUrl);
  const xml = buildSitemapXml(products);
  const ttl = ok ? EDGE_CACHE_TTL_SECONDS : 60;

  const response = new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
    },
  });

  if (cache && ok) {
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const normalizedPath = normalizePath(url.pathname);
    const apiBaseUrl = (env.API_BASE_URL || 'https://api.cdepearlslombok.id/api/v1').replace(
      /\/+$/,
      '',
    );
    const apiOrigin = apiBaseUrl.replace(/\/api(\/v1)?\/?$/i, '');

    if (normalizedPath === '/robots.txt') {
      return new Response(ROBOTS_TXT_CONTENT, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (normalizedPath === '/sitemap.xml') {
      return handleSitemapRequest(request, ctx, apiBaseUrl);
    }

    // Do not serve SPA HTML for missing static assets (.js, .css, images, fonts, etc.)
    if (STATIC_FILE_EXT_RE.test(normalizedPath)) {
      return new Response('Not Found', {
        status: 404,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }

    // Private, admin, SPI, customer, auth, and transactional routes must never be indexed
    if (isPrivateNoindexPath(normalizedPath)) {
      const spaRes = await fetchSpaShell(env, url.origin);
      return rewriteHtmlWithRobotsNoindex(spaRes);
    }

    // Dynamic Product Detail SSR Meta + JSON-LD Injection
    const productMatch = normalizedPath.match(/^\/produk\/([^/]+)$/i);
    if (productMatch) {
      const productIdOrCode = decodeURIComponent(productMatch[1]);
      const [spaRes, { status, product }] = await Promise.all([
        fetchSpaShell(env, url.origin),
        fetchSingleProductWithCache(apiBaseUrl, productIdOrCode, ctx),
      ]);

      if (product && product.id) {
        if (!isPublishableProductStatus(product.status)) {
          return rewriteHtmlWithRobotsNoindex(spaRes);
        }
        const meta = buildProductSeoMeta(product, normalizedPath, apiOrigin);
        return rewriteHtmlForProduct(spaRes, meta, apiOrigin);
      }

      if (status === 404) {
        return rewriteHtmlWithRobotsNoindex(spaRes);
      }

      // API timeout or transient failure: safe fallback to SPA shell without error
      const headers = new Headers(spaRes.headers);
      headers.set('Content-Type', 'text/html; charset=utf-8');
      headers.set('Cache-Control', 'no-store');
      return new Response(spaRes.body, {
        status: 200,
        headers,
      });
    }

    // Alias /koleksi -> canonical /katalog
    if (normalizedPath === '/koleksi') {
      const spaRes = await fetchSpaShell(env, url.origin);
      return rewriteHtmlWithCanonical(spaRes, '/katalog');
    }

    // Other public non-prerendered routes (e.g. /studio, /cek-sertifikat, /bantuan, /kebijakan-privasi, /syarat-ketentuan)
    // Unknown paths are still rendered by client React Router NotFoundPage (<Seo noindex />).
    const knownNonPrerenderedPublic = new Set([
      '/studio',
      '/cek-sertifikat',
      '/bantuan',
      '/kebijakan-privasi',
      '/syarat-ketentuan',
    ]);
    const spaRes = await fetchSpaShell(env, url.origin);
    if (knownNonPrerenderedPublic.has(normalizedPath)) {
      return rewriteHtmlWithCanonical(spaRes, normalizedPath);
    }

    return rewriteHtmlWithRobotsNoindex(spaRes);
  },
};
