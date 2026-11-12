import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:8787';

const PRERENDERED_PUBLIC_ROUTES = [
  { path: '/', expectedTitlePart: "CD'E Pearls Lombok", expectedCanonical: 'https://cdepearlslombok.id/' },
  { path: '/katalog', expectedTitlePart: 'Katalog Perhiasan Mutiara Lombok', expectedCanonical: 'https://cdepearlslombok.id/katalog' },
  { path: '/edukasi', expectedTitlePart: 'Edukasi & Gradasi Mutiara Lombok', expectedCanonical: 'https://cdepearlslombok.id/edukasi' },
  { path: '/tentang', expectedTitlePart: 'Tentang Atelier & Budidaya Lombok', expectedCanonical: 'https://cdepearlslombok.id/tentang' },
  { path: '/kontak', expectedTitlePart: 'Kontak Butik & Concierge Lombok', expectedCanonical: 'https://cdepearlslombok.id/kontak' },
];

test.describe(`SEO & SSR Hydration Verification [${BASE_URL}]`, () => {
  for (const route of PRERENDERED_PUBLIC_ROUTES) {
    test(`Prerender & hydration bersih tanpa error pada ${route.path}`, async ({ page }) => {
      const hydrationIssues: string[] = [];
      const pageErrors: string[] = [];

      page.on('pageerror', (err) => pageErrors.push(err.message));
      page.on('console', (msg) => {
        const text = msg.text();
        if (
          text.toLowerCase().includes('hydrat') ||
          text.includes('did not match') ||
          msg.type() === 'error'
        ) {
          hydrationIssues.push(`[${msg.type()}] ${text}`);
        }
      });

      await page.goto(`${BASE_URL}${route.path}`, { waitUntil: 'networkidle' });

      const title = await page.title();
      expect(title).toContain(route.expectedTitlePart);
      expect(title.length).toBeLessThanOrEqual(60);

      const desc = await page.locator('meta[name="description"]').first().getAttribute('content');
      expect(desc).toBeTruthy();
      expect((desc || '').length).toBeLessThanOrEqual(160);

      const canonical = await page.locator('link[rel="canonical"]').first().getAttribute('href');
      expect(canonical).toBe(route.expectedCanonical);

      const robotsCount = await page.locator('meta[name="robots"]').count();
      expect(robotsCount).toBe(1);
      const robotsContent = await page.locator('meta[name="robots"]').first().getAttribute('content');
      expect(robotsContent).toBe('index, follow');

      const ogLocale = await page.locator('meta[property="og:locale"]').first().getAttribute('content');
      expect(ogLocale).toBe('id_ID');

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBe(1);

      if (route.path === '/') {
        const jsonLdTexts = await page.locator('script[type="application/ld+json"]').allTextContents();
        const combined = jsonLdTexts.join('\n');
        expect(combined).toContain('"@type":"Organization"');
        expect(combined).toContain('"@type":"LocalBusiness"');
      }

      expect(pageErrors).toEqual([]);
      const filteredHydrationIssues = hydrationIssues.filter(
        (m) => m.toLowerCase().includes('hydrat') || m.includes('did not match'),
      );
      expect(filteredHydrationIssues).toEqual([]);
    });
  }

  for (const privatePath of ['/admin', '/spi', '/akun']) {
    test(`Rute privat ${privatePath} mengirim X-Robots-Tag dan meta noindex`, async ({
      page,
      request,
    }) => {
      const res = await request.get(`${BASE_URL}${privatePath}`);
      expect(res.status()).toBe(200);
      expect(res.headers()['x-robots-tag']).toContain('noindex');
      const html = await res.text();
      expect(html).toContain('content="noindex, nofollow"');

      await page.goto(`${BASE_URL}${privatePath}`, { waitUntil: 'domcontentloaded' });
      const robots = await page.locator('meta[name="robots"]').first().getAttribute('content');
      expect(robots).toContain('noindex');
    });
  }

  test('Sitemap dinamis dan Edge HTMLRewriter /produk/:id menyuntikkan JSON-LD Product', async ({
    request,
  }) => {
    const sitemapRes = await request.get(`${BASE_URL}/sitemap.xml`);
    expect(sitemapRes.status()).toBe(200);
    const sitemapXml = await sitemapRes.text();
    expect(sitemapXml).toContain('<loc>https://cdepearlslombok.id/</loc>');
    expect(sitemapXml).toContain('<loc>https://cdepearlslombok.id/katalog</loc>');

    const productMatch = sitemapXml.match(/https:\/\/cdepearlslombok\.id(\/produk\/[^<]+)/);
    const productPath = productMatch
      ? productMatch[1]
      : process.env.SEO_TEST_PRODUCT_ID
      ? `/produk/${process.env.SEO_TEST_PRODUCT_ID}`
      : null;

    test.skip(!productPath, 'Tidak ada produk aktif di sitemap untuk diuji');
    if (!productPath) return;

    const prodRes = await request.get(`${BASE_URL}${productPath}`);
    expect(prodRes.status()).toBe(200);
    const prodHtml = await prodRes.text();
    expect(prodHtml).toContain('"@type":"Product"');
    expect(prodHtml).toContain('"@type":"BreadcrumbList"');
    expect(prodHtml).toContain(`href="https://cdepearlslombok.id${productPath}"`);
    expect(prodHtml).not.toContain('content="noindex');
  });
});
