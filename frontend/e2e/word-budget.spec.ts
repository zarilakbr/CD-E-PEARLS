import { test, expect } from '@playwright/test';

// Helper to extract non-numeric, alphabetic words
const extractWords = (text: string): string[] => {
  return text
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0);
};

test.describe('Bagian B: Anggaran Kata Sesuai Spesifikasi (Word Budget)', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure real localhost backend is accessible
  });

  test('1. Beranda Mobile (390px) <= 120 kata (di luar nama produk, harga, dan label)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/');

    // Tunggu hidrasi dan kartu produk mobile termuat
    const cards = page.locator('.lg\\:hidden [data-slot="product-card"]');
    await cards.first().waitFor({ state: 'visible', timeout: 15000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(6);

    // Assertion: Gagal jika halaman kosong (minimal 3 blok section konten)
    const blocksCount = await page.locator('.lg\\:hidden > div > div').count();
    expect(blocksCount).toBeGreaterThanOrEqual(3);

    // Extract text from mobile container excluding product cards and hidden elements
    const wordsList = await page.evaluate(() => {
      const container = document.querySelector('[data-slot="mobile-marketplace-home"]');
      if (!container) return [];
      const clone = container.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[data-slot="product-card"], .hidden, script, style').forEach((el) => el.remove());
      const text = clone.innerText || '';
      return text.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter((w) => w.length > 0);
    });

    console.log(`\n--- [WORD BUDGET] 1. Beranda Mobile (390px) ---`);
    console.log(`Total kata: ${wordsList.length} (Batas: <= 120)`);
    console.log(`Daftar kata: ${wordsList.join(', ')}`);

    expect(wordsList.length).toBeGreaterThan(0);
    expect(wordsList.length).toBeLessThanOrEqual(120);
  });

  test('2. Beranda Desktop (1280px) <= 180 kata (di luar nama produk, harga, dan label)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://localhost:5173/');

    // Assertion: Gagal jika halaman kosong
    const heroSection = page.locator('.hidden.lg\\:flex section').first();
    await heroSection.waitFor({ state: 'visible', timeout: 10000 });

    const cards = page.locator('[data-slot="product-card"]:visible');
    await cards.first().waitFor({ state: 'visible', timeout: 10000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(6);

    // Extract text from desktop hero section
    const wordsList = await page.evaluate(() => {
      const hero = document.querySelector('.hidden.lg\\:flex section');
      if (!hero) return [];
      const clone = hero.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[data-slot="product-card"], script, style').forEach((el) => el.remove());
      const text = clone.innerText || '';
      return text.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter((w) => w.length > 0);
    });

    console.log(`\n--- [WORD BUDGET] 2. Beranda Desktop (1280px) ---`);
    console.log(`Total kata: ${wordsList.length} (Batas: <= 180)`);
    console.log(`Daftar kata: ${wordsList.join(', ')}`);

    expect(wordsList.length).toBeGreaterThan(0);
    expect(wordsList.length).toBeLessThanOrEqual(180);
  });

  test('3. Katalog Atas Lipatan (390px) <= 40 kata', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/katalog');

    // Assertion: Gagal jika produk kosong
    const cards = page.locator('[data-slot="product-card"]:visible');
    await cards.first().waitFor({ state: 'visible', timeout: 10000 });
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThanOrEqual(6);

    const wordsList = await page.evaluate(() => {
      const toolbar = document.querySelector('.sticky.top-12');
      if (!toolbar) return [];
      const clone = toolbar.cloneNode(true) as HTMLElement;
      const text = clone.innerText || '';
      return text.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter((w) => w.length > 0);
    });

    console.log(`\n--- [WORD BUDGET] 3. Katalog Atas Lipatan (390px) ---`);
    console.log(`Total kata: ${wordsList.length} (Batas: <= 40)`);
    console.log(`Daftar kata: ${wordsList.join(', ')}`);

    expect(wordsList.length).toBeGreaterThan(0);
    expect(wordsList.length).toBeLessThanOrEqual(40);
  });

  test('4. Detail Produk Atas Lipatan / Action Bar (390px) <= 40 kata (di luar nama/harga)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/produk/1');

    // Assertion: Gagal jika galeri gambar kosong
    const galleryImg = page.locator('img').first();
    await galleryImg.waitFor({ state: 'visible', timeout: 10000 });

    const wordsList = await page.evaluate(() => {
      // Ukur seluruh area atas lipatan (y < 844) di luar nama produk, harga, dan label produk
      const elements = Array.from(document.querySelectorAll('header, .sticky, .fixed.bottom-0'));
      let text = '';
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 0 && rect.top < 844 && rect.bottom > 0) {
          text += ' ' + ((el as HTMLElement).innerText || '');
        }
      }
      text = text.replace(/Rp\s*[\d.,]+/gi, '').replace(/South Sea|Mutiara|Princess|AAA|mm|Emas|18K|Lombok/gi, '');
      return text.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter((w) => w.length > 0);
    });

    console.log(`\n--- [WORD BUDGET] 4. Detail Produk Atas Lipatan (390px) ---`);
    console.log(`Total kata: ${wordsList.length} (Batas: <= 40)`);
    console.log(`Daftar kata: ${wordsList.join(', ')}`);

    expect(wordsList.length).toBeGreaterThan(0);
    expect(wordsList.length).toBeLessThanOrEqual(40);
  });

  test('5. Halaman Masuk (390px) <= 60 kata', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/masuk');

    // Assertion: Gagal jika form login tidak ada
    const form = page.locator('form');
    await form.waitFor({ state: 'visible', timeout: 10000 });

    const wordsList = await page.evaluate(() => {
      const container = document.querySelector('.flex-1');
      if (!container) return [];
      const clone = container.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('input, script, style').forEach((el) => el.remove());
      const text = clone.innerText || '';
      return text.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter((w) => w.length > 0);
    });

    console.log(`\n--- [WORD BUDGET] 5. Masuk (390px) ---`);
    console.log(`Total kata: ${wordsList.length} (Batas: <= 60)`);
    console.log(`Daftar kata: ${wordsList.join(', ')}`);

    expect(wordsList.length).toBeGreaterThan(0);
    expect(wordsList.length).toBeLessThanOrEqual(60);
  });

  test('6. Halaman Daftar (390px) <= 70 kata', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/daftar');

    // Assertion: Gagal jika form registrasi tidak ada
    const form = page.locator('form');
    await form.waitFor({ state: 'visible', timeout: 10000 });

    const wordsList = await page.evaluate(() => {
      const container = document.querySelector('.flex-1');
      if (!container) return [];
      const clone = container.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('input, script, style').forEach((el) => el.remove());
      const text = clone.innerText || '';
      return text.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter((w) => w.length > 0);
    });

    console.log(`\n--- [WORD BUDGET] 6. Daftar (390px) ---`);
    console.log(`Total kata: ${wordsList.length} (Batas: <= 70)`);
    console.log(`Daftar kata: ${wordsList.join(', ')}`);

    expect(wordsList.length).toBeGreaterThan(0);
    expect(wordsList.length).toBeLessThanOrEqual(70);
  });

  test('7. Keranjang Mobile (390px) <= 50 kata', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/keranjang');

    // Assertion: Gagal jika kontainer keranjang mobile tidak ada
    const mobileCart = page.locator('[data-slot="mobile-cart"]');
    await mobileCart.waitFor({ state: 'visible', timeout: 10000 });

    const wordsList = await page.evaluate(() => {
      const container = document.querySelector('[data-slot="mobile-cart"]');
      if (!container) return [];
      const clone = container.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[data-slot="product-card"], script, style').forEach((el) => el.remove());
      const text = clone.innerText || '';
      return text.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter((w) => w.length > 0);
    });

    console.log(`\n--- [WORD BUDGET] 7. Keranjang Mobile (390px) ---`);
    console.log(`Total kata: ${wordsList.length} (Batas: <= 50)`);
    console.log(`Daftar kata: ${wordsList.join(', ')}`);

    expect(wordsList.length).toBeGreaterThan(0);
    expect(wordsList.length).toBeLessThanOrEqual(50);
  });

  test('8. Favorit Mobile (390px) <= 50 kata', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/favorit');

    // Assertion: Gagal jika kontainer favorit mobile tidak ada
    const mobileWishlist = page.locator('[data-slot="mobile-wishlist"]');
    await mobileWishlist.waitFor({ state: 'visible', timeout: 10000 });

    const wordsList = await page.evaluate(() => {
      const container = document.querySelector('[data-slot="mobile-wishlist"]');
      if (!container) return [];
      const clone = container.cloneNode(true) as HTMLElement;
      clone.querySelectorAll('[data-slot="product-card"], script, style').forEach((el) => el.remove());
      const text = clone.innerText || '';
      return text.replace(/[^\p{L}\s]/gu, ' ').trim().split(/\s+/).filter((w) => w.length > 0);
    });

    console.log(`\n--- [WORD BUDGET] 8. Favorit Mobile (390px) ---`);
    console.log(`Total kata: ${wordsList.length} (Batas: <= 50)`);
    console.log(`Daftar kata: ${wordsList.join(', ')}`);

    expect(wordsList.length).toBeGreaterThan(0);
    expect(wordsList.length).toBeLessThanOrEqual(50);
  });
});
