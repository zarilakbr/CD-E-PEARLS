import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || process.env.PROD_URL || 'http://localhost:5173';
const IS_LOCAL = BASE_URL.includes('localhost') || BASE_URL.includes('127.0.0.1');
const HAS_PROD_BACKEND = process.env.PROD_BACKEND_AVAILABLE === 'true';

test.describe(`Smoke Test Asap: ${IS_LOCAL ? 'Uji Asap Lokal (Localhost)' : 'Uji Asap Produksi'} [BASE_URL: ${BASE_URL}]`, () => {
  test.beforeAll(() => {
    console.log(`\n=== SMOKE TEST TARGET: ${BASE_URL} (${IS_LOCAL ? 'Lokal' : 'Live Produksi'}) ===`);
  });
  test('1. Memuat /version.json dengan commit hash dan build time', async ({ request }) => {
    const res = await request.get(`${BASE_URL}/version.json`);
    expect(res.status()).toBe(200);
    const data = await res.json();
    expect(data).toHaveProperty('commit');
    expect(data).toHaveProperty('buildTime');
    expect(typeof data.commit).toBe('string');
    expect(data.commit.length).toBeGreaterThan(0);
  });

  test('2. Beranda menampilkan minimal 6 ProductCard', async ({ page }) => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);
    const productCards = page.locator('[data-slot="product-card"], img[alt*="Perhiasan"]');
    const count = await productCards.count();
    expect(count).toBeGreaterThanOrEqual(6);
  });

  test('3. /masuk menampilkan formulir autentikasi dan widget Turnstile', async ({ page }) => {
    await page.goto(`${BASE_URL}/masuk`, { waitUntil: 'domcontentloaded' });
    const form = page.locator('form');
    await expect(form).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Pastikan container / widget Turnstile terpasang
    const turnstileContainer = page.locator('[data-turnstile], .cf-turnstile, iframe[src*="cloudflare"], div[id*="cf-turnstile"], [data-testid="turnstile-container"]').first();
    const isTurnstilePresent = (await turnstileContainer.count()) > 0;
    expect(isTurnstilePresent).toBe(true);
  });

  test('4. Login akun uji produksi', async ({ page }) => {
    if (!HAS_PROD_BACKEND) {
      test.skip(true, 'BELUM DIUJI: Backend produksi belum tersedia / belum dikonfigurasi di environment PROD_BACKEND_AVAILABLE');
      return;
    }

    await page.goto(`${BASE_URL}/masuk`, { waitUntil: 'networkidle' });
    await page.fill('input[type="email"]', process.env.TEST_USER_EMAIL || 'customer@example.com');
    await page.fill('input[type="password"]', process.env.TEST_USER_PASSWORD || 'password');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/akun/);
  });
});
