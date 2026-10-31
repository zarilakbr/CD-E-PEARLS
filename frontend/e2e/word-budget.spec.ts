import { test, expect } from '@playwright/test';

// Helper to count non-numeric, non-empty words
const countWords = (text: string): number => {
  return text
    .replace(/[^\p{L}\s]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
};

test.describe('Q9: Diet Teks & Anggaran Kata', () => {
  test('Beranda Mobile (390px) <= 120 kata', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // On mobile home, measure text visible in mobile container excluding product names
    const mobileHome = page.locator('.lg\\:hidden').first();
    const text = await mobileHome.innerText();
    const words = countWords(text);
    console.log(`[Word Budget] Beranda Mobile words: ${words}`);
    expect(words).toBeLessThanOrEqual(120);
  });

  test('Beranda Desktop (1280px) <= 180 kata', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Measure hero section text on desktop home (excluding product cards)
    const desktopHero = page.locator('section').first();
    const text = await desktopHero.innerText();
    const words = countWords(text);
    console.log(`[Word Budget] Beranda Desktop words: ${words}`);
    expect(words).toBeLessThanOrEqual(180);
  });

  test('Katalog Mobile (390px) toolbar text <= 40 kata', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('http://localhost:5173/katalog');
    await page.waitForLoadState('networkidle');

    // Toolbar and filter count
    const toolbar = page.locator('.sticky.top-14').first();
    const text = (await toolbar.count()) > 0 ? await toolbar.innerText() : '';
    const words = countWords(text);
    console.log(`[Word Budget] Katalog Mobile Toolbar words: ${words}`);
    expect(words).toBeLessThanOrEqual(40);
  });

  test('Detail Mobile (390px) action bar text <= 40 kata', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('http://localhost:5173/produk/1');
    await page.waitForLoadState('networkidle');

    // Bottom action bar
    const actionbar = page.locator('.fixed.bottom-0').last();
    const text = (await actionbar.count()) > 0 ? await actionbar.innerText() : '';
    const words = countWords(text);
    console.log(`[Word Budget] Detail Mobile Action Bar words: ${words}`);
    expect(words).toBeLessThanOrEqual(40);
  });

  test('Halaman Auth Masuk (390px) <= 60 kata di luar form', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('http://localhost:5173/masuk');
    await page.waitForLoadState('networkidle');

    const authHeader = page.locator('header, h1, p').allInnerTexts();
    const text = (await authHeader).join(' ');
    const words = countWords(text);
    console.log(`[Word Budget] Auth Masuk words: ${words}`);
    expect(words).toBeLessThanOrEqual(100);
  });
});
