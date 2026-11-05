import { test, expect } from '@playwright/test';

test.describe('Tahap M: Pengujian Pencabutan Data Mock Katalog & Verifikasi Sumber API Murni', () => {
  test('1. Mock respons API kosong: buktikan tidak ada kartu produk dan tidak ada gambar produk uji di /katalog', async ({ page }) => {
    // Intersep seluruh pemanggilan API produk & kategori dengan data kosong
    await page.route('**/api/v1/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [], meta: { total: 0 } }),
      });
    });

    await page.route('**/api/v1/categories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/katalog', { waitUntil: 'domcontentloaded' });

    // Buktikan keadaan kosong yang rapi "Koleksi Segera Hadir" muncul pada tampilan aktif
    const emptyStateHeading = page.locator('text=Koleksi Segera Hadir').filter({ visible: true }).first();
    await expect(emptyStateHeading).toBeVisible({ timeout: 10000 });

    // Buktikan 0 kartu produk
    const productCards = page.locator('[data-slot="product-card"]');
    await expect(productCards).toHaveCount(0);

    // Buktikan TIDAK ADA gambar produk uji coba (cat_ring_silk)
    const testImages = page.locator('img[src*="cat_ring_silk"]');
    await expect(testImages).toHaveCount(0);

    // Buktikan tidak ada nama produk uji lama yang bocor dari fallback
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Kalung Mutiara South Sea Princess AAA');
    expect(bodyText).not.toContain('Gelang Rantai Mutiara Emas Imperial');
    expect(bodyText).not.toContain('Cincin Solitaire Tahitian Black Pearl 12mm');
  });

  test('2. Mock respons API kosong pada Beranda (/): buktikan tidak ada kartu produk palsu dan tidak ada gambar uji', async ({ page }) => {
    await page.route('**/api/v1/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.route('**/api/v1/categories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Buktikan keadaan kosong "Koleksi Segera Hadir" muncul di beranda pada tampilan aktif
    const emptyState = page.locator('text=Koleksi Segera Hadir').filter({ visible: true }).first();
    await expect(emptyState).toBeVisible({ timeout: 10000 });

    // Buktikan 0 kartu produk
    const productCards = page.locator('[data-slot="product-card"]');
    await expect(productCards).toHaveCount(0);

    // Buktikan TIDAK ADA gambar produk uji coba (cat_ring_silk)
    const testImages = page.locator('img[src*="cat_ring_silk"]');
    await expect(testImages).toHaveCount(0);

    // Buktikan tidak ada metrik palsu (harga, rating, soldCount tiruan)
    const bodyText = await page.textContent('body');
    expect(bodyText).not.toContain('Kalung Mutiara South Sea Princess AAA');
    expect(bodyText).not.toContain('Gelang Rantai Mutiara Emas Imperial');
  });

  test('3. Satu tes dengan 1 produk dari API: membuktikan render normal tetap berjalan', async ({ page }) => {
    const liveItem = {
      id: 99,
      name: 'Cincin Mahkota Mutiara Lombok 18K Solid',
      category: { name: 'Cincin Mutiara', slug: 'cincin-mutiara' },
      category_slug: 'cincin-mutiara',
      varietas: 'South Sea Pearl',
      grade: 'AAA',
      ukuran_mm: '12.5',
      logam: 'Emas 18K',
      berat: '5.2 gr',
      bentuk: 'Bulat Sempurna',
      price: 18500000,
      stock: 5,
      status: 'published',
      image: '/images/hero_pearl_shell.jpg',
    };

    await page.route('**/api/v1/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [liveItem], meta: { total: 1 } }),
      });
    });

    await page.route('**/api/v1/categories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 1, name: 'Cincin Mutiara', slug: 'cincin-mutiara' }] }),
      });
    });

    await page.goto('/katalog', { waitUntil: 'domcontentloaded' });

    // Buktikan produk tunggal dari API dirender secara normal pada tampilan aktif
    const productCard = page.locator('[data-slot="product-card"]').filter({ visible: true }).first();
    await expect(productCard).toBeVisible({ timeout: 10000 });

    await expect(page.locator('text=Cincin Mahkota Mutiara Lombok 18K Solid').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text=18.500.000').filter({ visible: true }).first()).toBeVisible();

    // Pastikan tidak ada gambar uji coba
    const testImages = page.locator('img[src*="cat_ring_silk"]');
    await expect(testImages).toHaveCount(0);
  });
});

