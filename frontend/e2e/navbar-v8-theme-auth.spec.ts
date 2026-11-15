import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Tahap V8: Visibilitas Tombol Tema Khusus Pengguna Login', () => {
  const screenshotDir = path.resolve(process.cwd(), 'e2e/screenshots/tahap-v8');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  const mockUser = {
    id: 1,
    name: 'Siti Rahma',
    email: 'siti@cdepearlslombok.id',
    role: 'user',
    status: 'active',
  };

  test('1. Desktop 1280px: Belum Login vs Sudah Login', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // A. Belum Login (Unauthenticated)
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({ status: 401, json: { message: 'Unauthenticated' } });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.removeItem('cde_auth_token'));
    await page.waitForTimeout(400);

    // Verifikasi tombol switch tema tidak ada di DOM
    const themeSwitchUnauth = page.locator('header button[role="switch"]');
    expect(await themeSwitchUnauth.count()).toBe(0);

    // Verifikasi pemilih bahasa ID | EN ada
    const langBtnId = page.locator('header button:has-text("ID")');
    const langBtnEn = page.locator('header button:has-text("EN")');
    expect(await langBtnId.count()).toBeGreaterThan(0);
    expect(await langBtnEn.count()).toBeGreaterThan(0);

    const header = page.locator('header[data-slot="mobile-header"]');
    await header.screenshot({
      path: path.join(screenshotDir, 'navbar-1280px-unauth.png'),
    });

    // B. Sudah Login (Authenticated)
    await page.unroute('**/api/**/auth/me');
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, user: mockUser },
      });
    });
    await page.evaluate(() => localStorage.setItem('cde_auth_token', 'mock-valid-token'));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('header button[role="switch"]', { timeout: 10000 });

    const themeSwitchAuth = page.locator('header button[role="switch"]');
    expect(await themeSwitchAuth.count()).toBe(1);

    await header.screenshot({
      path: path.join(screenshotDir, 'navbar-1280px-auth.png'),
    });
  });

  test('2. Desktop 1440px: Belum Login vs Sudah Login', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });

    // A. Belum Login
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({ status: 401, json: { message: 'Unauthenticated' } });
    });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.removeItem('cde_auth_token'));
    await page.waitForTimeout(400);

    expect(await page.locator('header button[role="switch"]').count()).toBe(0);
    expect(await page.locator('header button:has-text("ID")').count()).toBeGreaterThan(0);
    expect(await page.locator('header button:has-text("EN")').count()).toBeGreaterThan(0);

    const header = page.locator('header[data-slot="mobile-header"]');
    await header.screenshot({
      path: path.join(screenshotDir, 'navbar-1440px-unauth.png'),
    });

    // B. Sudah Login
    await page.unroute('**/api/**/auth/me');
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, user: mockUser },
      });
    });
    await page.evaluate(() => localStorage.setItem('cde_auth_token', 'mock-valid-token'));
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('header button[role="switch"]', { timeout: 10000 });

    expect(await page.locator('header button[role="switch"]').count()).toBe(1);

    await header.screenshot({
      path: path.join(screenshotDir, 'navbar-1440px-auth.png'),
    });
  });

  test('3. Mobile 360px: Halaman /akun (GuestAccountHub tanpa tombol tema vs login)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });

    // A. Belum Login di /akun -> Merender GuestAccountHub
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({ status: 401, json: { message: 'Unauthenticated' } });
    });
    await page.goto('/akun', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => localStorage.removeItem('cde_auth_token'));
    await page.waitForTimeout(400);

    // Verifikasi teks "Akun Koleksi Tamu" muncul
    await expect(page.locator('text=Akun Koleksi Tamu')).toBeVisible();

    // Verifikasi "Tema Tampilan" tidak ada di DOM
    expect(await page.locator('text=Tema Tampilan').count()).toBe(0);

    // Verifikasi "Bahasa" ID | EN tetap ada
    await expect(page.locator('text=Bahasa')).toBeVisible();

    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-360px-unauth-hub.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 360, height: 580 },
    });

    // B. Sudah Login di /akun -> Merender Portal Pelanggan Butik
    await page.unroute('**/api/**/auth/me');
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, user: mockUser },
      });
    });
    await page.route('**/api/**/orders*', (route) => {
      route.fulfill({ status: 200, json: { success: true, data: [] } });
    });
    await page.evaluate(() => localStorage.setItem('cde_auth_token', 'mock-valid-token'));
    await page.goto('/akun', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-360px-auth-hub.png'),
      fullPage: false,
      clip: { x: 0, y: 0, width: 360, height: 580 },
    });
  });
});
