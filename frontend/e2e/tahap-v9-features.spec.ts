import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Tahap V9: Hapus Studio 3D Dari Publik, Kustom Setelah Login, Bahasa Setelah Login, Tema Default Terang', () => {
  const screenshotDir = path.resolve(process.cwd(), 'e2e/screenshots/tahap-v9');

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

  test('1. Beranda Tamu Desktop 1280px (Terang walau emulasi dark, Tanpa Studio 3D, Tanpa Bahasa)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    // Emulasi preferensi OS mode gelap
    await page.emulateMedia({ colorScheme: 'dark' });

    // Mock API Auth Unauthenticated
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({ status: 401, json: { message: 'Unauthenticated' } });
    });

    await page.addInitScript(() => {
      localStorage.removeItem('cde_auth_token');
      localStorage.removeItem('cde_theme');
      localStorage.removeItem('cde_language');
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verifikasi tema tetap 'light' walau prefers-color-scheme: dark
    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const isDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(dataTheme).toBe('light');
    expect(isDarkClass).toBe(false);

    // Verifikasi ketiadaan Studio 3D di navbar desktop
    const desktopNav = page.locator('header nav');
    const navText = await desktopNav.textContent();
    expect(navText).not.toContain('Studio 3D');
    expect(navText).not.toContain('Studio 3D Atelier');
    expect(navText).not.toContain('Kustom Perhiasan');

    // Verifikasi kontrol bahasa TIDAK ADA di header
    const langBtnId = page.locator('header button:has-text("ID")');
    expect(await langBtnId.count()).toBe(0);

    // Verifikasi tombol tema TIDAK ADA di header
    const themeSwitch = page.locator('header button[role="switch"]');
    expect(await themeSwitch.count()).toBe(0);

    // Ambil Screenshot Navbar & Beranda Tamu Desktop
    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1280px-tamu-beranda.png'),
      fullPage: false,
    });
  });

  test('2. Beranda Tamu Ponsel 360px (Terang walau emulasi dark, Tanpa Studio 3D, Tanpa Bahasa)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 740 });
    // Emulasi preferensi OS mode gelap
    await page.emulateMedia({ colorScheme: 'dark' });

    // Mock API Auth Unauthenticated
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({ status: 401, json: { message: 'Unauthenticated' } });
    });

    await page.addInitScript(() => {
      localStorage.removeItem('cde_auth_token');
      localStorage.removeItem('cde_theme');
      localStorage.removeItem('cde_language');
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verifikasi tema tetap 'light'
    const dataTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(dataTheme).toBe('light');

    // Verifikasi kartu / chip Studio 3D tidak ada di halaman beranda
    const content = await page.locator('body').textContent();
    expect(content).not.toContain('Studio 3D');
    expect(content).not.toContain('Desain Kustom Studio 3D');

    // Ambil Screenshot Beranda Tamu Mobile
    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-360px-tamu-beranda.png'),
      fullPage: false,
    });

    // Buka Akun Tamu (/akun) dan verifikasi ketiadaan pemilih bahasa dan tema
    await page.goto('/akun', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    const akunContent = await page.locator('body').textContent();
    expect(akunContent).not.toContain('Studio 3D');
    expect(akunContent).not.toContain('Tema Tampilan');

    await page.screenshot({
      path: path.join(screenshotDir, 'mobile-360px-tamu-akun.png'),
      fullPage: false,
    });
  });

  test('3. Pengguna Login Desktop 1280px (Ada Bahasa, Tema, Menu Kustom Perhiasan)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Mock API Auth Authenticated
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, user: mockUser },
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'valid-token-for-test');
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    // Verifikasi menu Kustom Perhiasan ada di navbar desktop
    const desktopNav = page.locator('header nav');
    const navText = await desktopNav.textContent();
    expect(navText).toContain('Kustom Perhiasan');

    // Verifikasi pemilih bahasa MUNCUL
    const langBtnId = page.locator('header button:has-text("ID")');
    const langBtnEn = page.locator('header button:has-text("EN")');
    expect(await langBtnId.count()).toBeGreaterThan(0);
    expect(await langBtnEn.count()).toBeGreaterThan(0);

    // Verifikasi tombol switch tema MUNCUL
    const themeSwitch = page.locator('header button[role="switch"]');
    expect(await themeSwitch.count()).toBeGreaterThan(0);

    // Ambil Screenshot Navbar & Beranda Pengguna Login Desktop
    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1280px-login-beranda.png'),
      fullPage: false,
    });
  });

  test('4. Pengguna Login Dashboard Pelanggan (/akun) (Menu Kustom Perhiasan berfungsi)', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    // Mock API Auth Authenticated
    await page.route('**/api/**/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { success: true, user: mockUser },
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'valid-token-for-test');
    });

    await page.goto('/akun', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);

    // Verifikasi ada menu "Kustom Perhiasan" di sidebar
    const kustomMenuBtn = page.locator('button:has-text("Kustom Perhiasan")');
    expect(await kustomMenuBtn.count()).toBeGreaterThan(0);

    // Klik menu "Kustom Perhiasan" dan pastikan tampilan kustomisasi muncul
    await kustomMenuBtn.first().click();
    await page.waitForTimeout(400);

    expect(await page.locator('body').textContent()).toContain('Kustom Perhiasan Atelier');

    // Ambil Screenshot Dashboard Pelanggan dengan menu Kustom Perhiasan aktif
    await page.screenshot({
      path: path.join(screenshotDir, 'desktop-1280px-login-dashboard.png'),
      fullPage: false,
    });
  });
});
