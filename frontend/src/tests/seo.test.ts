import { describe, expect, it } from 'vitest';
import {
  BRAND_NAME,
  ROBOTS_TXT_CONTENT,
  SITE_URL,
  buildBreadcrumbJsonLd,
  buildLocalBusinessJsonLd,
  buildOrganizationJsonLd,
  buildProductJsonLd,
  buildProductSeoMeta,
  buildSitemapXml,
  clampDescription,
  clampTitle,
  isPrivateNoindexPath,
} from '../lib/seo';

describe('SEO & Structured Data Helpers', () => {
  it('1. generates valid Organization and LocalBusiness JSON-LD for Home page', () => {
    const org = buildOrganizationJsonLd();
    const local = buildLocalBusinessJsonLd();

    expect(org['@context']).toBe('https://schema.org');
    expect(org['@type']).toBe('Organization');
    expect(org.name).toBe(BRAND_NAME);
    expect(org.url).toBe(`${SITE_URL}/`);

    expect(local['@type']).toBe('LocalBusiness');
    expect(local.address).toMatchObject({
      '@type': 'PostalAddress',
      addressLocality: 'Lombok Barat',
      addressRegion: 'Nusa Tenggara Barat',
      addressCountry: 'ID',
    });
  });

  it('2. omits aggregateRating when no real reviews exist despite default rating=5', () => {
    const productLd = buildProductJsonLd({
      id: 12,
      code: 'LMB-012',
      name: 'Kalung Mutiara South Sea Gold',
      price: 24500000,
      stock: 3,
      rating: 5,
      reviews_count: 0,
      reviews: [],
      varietas: 'Golden South Sea',
      grade: 'AAA',
      logam: 'Emas 18K',
      ukuran_mm: '11-12',
      image: '/storage/products/kalung-gold.jpg',
      category: { name: 'Kalung Mutiara', slug: 'kalung' },
    });

    expect(productLd['@type']).toBe('Product');
    expect(productLd.sku).toBe('LMB-012');
    expect(productLd.image).toEqual([
      'https://api.cdepearlslombok.id/storage/products/kalung-gold.jpg',
    ]);
    expect(productLd.offers).toMatchObject({
      '@type': 'Offer',
      priceCurrency: 'IDR',
      price: 24500000,
      availability: 'https://schema.org/InStock',
      url: 'https://cdepearlslombok.id/produk/12',
    });
    expect('aggregateRating' in productLd).toBe(false);
  });

  it('3. includes aggregateRating when real reviews exist and marks OutOfStock when stock=0', () => {
    const productLd = buildProductJsonLd({
      id: 19,
      code: 'LMB-019',
      name: 'Cincin Mutiara Putih Kolektor',
      price: 15000000,
      stock: 0,
      rating: 4.85,
      reviews_count: 7,
      reviews: [{ id: 1, rating: 5 }],
      image: '/images/hero_pearl_shell.jpg',
    });

    expect(productLd.offers).toMatchObject({
      availability: 'https://schema.org/OutOfStock',
    });
    expect(productLd.aggregateRating).toEqual({
      '@type': 'AggregateRating',
      ratingValue: 4.85,
      reviewCount: 7,
    });
  });

  it('4. builds clamped Indonesian product SEO meta and BreadcrumbList JSON-LD', () => {
    const meta = buildProductSeoMeta({
      id: 5,
      code: 'LMB-005',
      name: 'Liontin Mutiara Air Laut Selatan Lombok Super Eksklusif Berbalut Emas 18K',
      price: 18500000,
      stock: 2,
      varietas: 'White South Sea',
      grade: 'AAA',
    });

    expect(meta.title.length).toBeLessThanOrEqual(60);
    expect(meta.description.length).toBeLessThanOrEqual(160);
    expect(meta.canonicalUrl).toBe('https://cdepearlslombok.id/produk/5');
    expect(meta.jsonLd).toHaveLength(2);
    expect(meta.jsonLd[0]['@type']).toBe('Product');
    expect(meta.jsonLd[1]).toEqual(
      buildBreadcrumbJsonLd([
        { name: 'Beranda', path: '/' },
        { name: 'Katalog', path: '/katalog' },
        {
          name: 'Liontin Mutiara Air Laut Selatan Lombok Super Eksklusif Berbalut Emas 18K',
          path: '/produk/5',
        },
      ]),
    );
  });

  it('5. builds valid sitemap XML containing static public routes, active/published products, and escaped XML', () => {
    const xml = buildSitemapXml(
      [
        { id: 101, code: 'P-101', status: 'published', updated_at: '2026-11-10T08:30:00Z' },
        { id: 102, code: 'P-102&test', status: 'draft', updated_at: '2026-11-11T08:30:00Z' },
        { id: 103, code: 'P-103', status: 'active', updated_at: 'invalid-date' },
      ],
      { today: '2026-11-12' },
    );

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://cdepearlslombok.id/</loc>');
    expect(xml).toContain('<loc>https://cdepearlslombok.id/katalog</loc>');
    expect(xml).toContain('<loc>https://cdepearlslombok.id/edukasi</loc>');
    expect(xml).toContain('<loc>https://cdepearlslombok.id/tentang</loc>');
    expect(xml).toContain('<loc>https://cdepearlslombok.id/kontak</loc>');
    expect(xml).toContain('<loc>https://cdepearlslombok.id/produk/101</loc>');
    expect(xml).toContain('<lastmod>2026-11-10</lastmod>');
    expect(xml).toContain('<loc>https://cdepearlslombok.id/produk/103</loc>');
    expect(xml).toContain('<lastmod>2026-11-12</lastmod>');
    expect(xml).not.toContain('/produk/102');
    expect(xml).not.toContain('/admin');
    expect(xml).not.toContain('/spi');
    expect(xml).not.toContain('/akun');
  });

  it('6. detects private and transactional noindex routes accurately', () => {
    expect(isPrivateNoindexPath('/admin')).toBe(true);
    expect(isPrivateNoindexPath('/admin/orders')).toBe(true);
    expect(isPrivateNoindexPath('/spi')).toBe(true);
    expect(isPrivateNoindexPath('/akun/pesanan')).toBe(true);
    expect(isPrivateNoindexPath('/checkout')).toBe(true);
    expect(isPrivateNoindexPath('/masuk')).toBe(true);
    expect(isPrivateNoindexPath('/daftar')).toBe(true);
    expect(isPrivateNoindexPath('/login')).toBe(true);
    expect(isPrivateNoindexPath('/register')).toBe(true);
    expect(isPrivateNoindexPath('/keranjang')).toBe(true);
    expect(isPrivateNoindexPath('/favorit')).toBe(true);

    expect(isPrivateNoindexPath('/')).toBe(false);
    expect(isPrivateNoindexPath('/katalog')).toBe(false);
    expect(isPrivateNoindexPath('/edukasi')).toBe(false);
    expect(isPrivateNoindexPath('/tentang')).toBe(false);
    expect(isPrivateNoindexPath('/kontak')).toBe(false);
    expect(isPrivateNoindexPath('/produk/101')).toBe(false);
  });

  it('7. exports compliant robots.txt rules and clamps titles and descriptions cleanly', () => {
    expect(ROBOTS_TXT_CONTENT).toContain('Disallow: /admin');
    expect(ROBOTS_TXT_CONTENT).toContain('Disallow: /spi');
    expect(ROBOTS_TXT_CONTENT).toContain('Disallow: /akun');
    expect(ROBOTS_TXT_CONTENT).toContain('Disallow: /checkout');
    expect(ROBOTS_TXT_CONTENT).toContain('Disallow: /api');
    expect(ROBOTS_TXT_CONTENT).toContain('Sitemap: https://cdepearlslombok.id/sitemap.xml');
    expect(clampTitle('A '.repeat(50)).length).toBeLessThanOrEqual(60);
    expect(clampDescription('Kata '.repeat(60)).length).toBeLessThanOrEqual(160);
  });
});
