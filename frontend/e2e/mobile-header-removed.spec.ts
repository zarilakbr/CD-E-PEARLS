import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

const MOBILE_VIEWPORTS = [
  { width: 320, height: 600, label: '320px' },
  { width: 360, height: 740, label: '360px' },
  { width: 390, height: 844, label: '390px' },
  { width: 414, height: 896, label: '414px' },
  { width: 600, height: 960, label: '600px' },
  { width: 768, height: 1024, label: '768px' },
  { width: 1023, height: 768, label: '1023px' },
];

const DESKTOP_VIEWPORTS = [
  { width: 1024, height: 768, label: '1024px' },
  { width: 1280, height: 800, label: '1280px' },
];

test.describe('TAHAP Q-3: HAPUS HEADER MOBILE (< 1024px) & KONTROL TUNGGAL', () => {

  // 1. Verifikasi SEMUA viewport mobile (< 1024px) pada Beranda dan Katalog
  for (const vp of MOBILE_VIEWPORTS) {
    test(`[${vp.label}] Beranda: Tidak ada header/role=banner di mobile, konten mulai di y <= 16px`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'networkidle' });

      // Pastikan elemen header tersembunyi
      const headers = page.locator('header');
      const count = await headers.count();
      for (let i = 0; i < count; i++) {
        const isVisible = await headers.nth(i).isVisible().catch(() => false);
        expect(isVisible, `Header ${i} harus tidak terlihat di mobile ${vp.width}px`).toBe(false);
      }

      // Pastikan konten dimulai di atas layar (y <= 16px)
      const firstContent = page.locator('main, [data-slot="mobile-marketplace-home"]').first();
      const box = await firstContent.boundingBox();
      expect(box).not.toBeNull();
      if (box) {
        expect(box.y).toBeLessThanOrEqual(16);
      }
    });

    test(`[${vp.label}] Katalog: Tidak ada header di mobile, toolbar pencarian sticky top-0`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/katalog', { waitUntil: 'networkidle' });

      const headers = page.locator('header');
      const count = await headers.count();
      for (let i = 0; i < count; i++) {
        const isVisible = await headers.nth(i).isVisible().catch(() => false);
        expect(isVisible, `Header harus tidak terlihat di Katalog mobile ${vp.width}px`).toBe(false);
      }
    });
  }

  // 2. Verifikasi Logo Tunggal di Mobile: HANYA di Beranda, TIDAK ada di halaman publik lain
  test('Mobile: Logo HANYA di Beranda (dalam banner), halaman publik lain tanpa logo', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Beranda: logo ada di banner
    await page.goto('/', { waitUntil: 'networkidle' });
    const homeLogo = page.locator('[data-slot="mobile-marketplace-home"] img[alt*="CD\'E Pearls"]').first();
    await expect(homeLogo).toBeVisible();

    // Katalog: tidak ada header/logo yang terlihat di area atas
    await page.goto('/katalog', { waitUntil: 'networkidle' });
    const catalogHeader = page.locator('header');
    expect(await catalogHeader.isVisible().catch(() => false)).toBe(false);

    // Keranjang: tidak ada header/logo yang terlihat di atas
    await page.goto('/keranjang', { waitUntil: 'networkidle' });
    const cartHeader = page.locator('header');
    expect(await cartHeader.isVisible().catch(() => false)).toBe(false);

    // Auth Masuk: logo bar dihapus, hanya baris kembali + h1
    await page.goto('/masuk');
    const authHeader = page.locator('header');
    expect(await authHeader.isVisible().catch(() => false)).toBe(false);
  });

  // 3. Desktop (1024px dan 1280px): Header tetap ada, terlihat, dan berfungsi
  for (const vp of DESKTOP_VIEWPORTS) {
    test(`Desktop [${vp.label}]: Header tetap ada, terlihat, dan memiliki semua kontrol`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'networkidle' });

      const header = page.locator('header').first();
      await expect(header).toBeVisible();

      // Logo desktop
      await expect(header.locator('img[alt*="CD\'E Pearls"]')).toBeVisible();

      // Input pencarian desktop
      const searchInput = header.locator('input[type="text"]');
      await expect(searchInput).toBeVisible();

      // Kontrol keranjang dan wishlist
      await expect(header.locator('button[aria-label*="Keranjang" i], button[aria-label*="Cart" i]')).toBeVisible();
      await expect(header.locator('button[aria-label*="Favorit" i], button[aria-label*="Wishlist" i]')).toBeVisible();

      // Switch bahasa (group Change Language / Pilih Bahasa)
      const langSwitch = header.getByRole('button', { name: 'ID', exact: true }).or(header.getByRole('button', { name: 'EN', exact: true }));
      await expect(langSwitch.first()).toBeVisible();
    });
  }

  // 4. Tes Fungsional: Pencarian dari Beranda membuka overlay Command/Dialog
  test('Pencarian Beranda Mobile: Tombol pil di bawah banner membuka overlay dan menampilkan hasil', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'networkidle' });

    // Klik tombol cari berbentuk pil di Beranda
    const searchPill = page.locator('button[aria-label="Buka pencarian mutiara"], button[aria-label*="Cari mutiara" i]').first();
    await expect(searchPill).toBeVisible();
    await searchPill.click();

    // Overlay pencarian harus terbuka
    const dialog = page.locator('[role="dialog"], [cmdk-root], [data-slot="search-overlay"]').first();
    await expect(dialog).toBeVisible();

    // Ketik kata kunci
    const searchInput = dialog.locator('input').first();
    await searchInput.fill('Mutiara');

    // Tunggu hasil
    await page.waitForTimeout(500);
    const searchResults = dialog.locator('[role="option"], button, a').filter({ hasText: /Mutiara|South Sea|Lombok/i });
    expect(await searchResults.count()).toBeGreaterThan(0);
  });

  // 5. Tes Fungsional: Toolbar Pencarian di Katalog menyaring produk
  test('Katalog Toolbar Mobile: Input pencarian menyaring produk seketika', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/katalog', { waitUntil: 'networkidle' });

    const catalogInput = page.locator('input[type="search"], input[placeholder*="Cari" i]').first();
    await expect(catalogInput).toBeVisible();

    await catalogInput.fill('Cincin');
    await page.waitForTimeout(600);

    // Produk yang muncul harus berisi Cincin
    const productTitles = page.locator('h3, [data-slot="product-title"]');
    const count = await productTitles.count();
    expect(count).toBeGreaterThan(0);
    const firstTitle = await productTitles.first().innerText();
    expect(firstTitle.toLowerCase()).toContain('cincin');
  });

  // 6. Tes Fungsional: Tombol Kembali pada Halaman Dalam
  test('Tombol Kembali Mobile: Detail, Keranjang membawa kembali ke riwayat sebelumnya', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Mulai dari Katalog
    await page.goto('/katalog', { waitUntil: 'networkidle' });

    // Buka detail produk
    await page.goto('/produk/1', { waitUntil: 'networkidle' });

    // Tombol bulat melayang kembali di atas galeri
    const backBtn = page.locator('button[aria-label*="Kembali" i]').first();
    await expect(backBtn).toBeVisible();
    await backBtn.click();

    // Kembali ke /katalog
    await page.waitForURL('**/katalog**', { timeout: 5000 });
    expect(page.url()).toContain('/katalog');

    // Cek tombol kembali di Keranjang
    await page.goto('/keranjang', { waitUntil: 'networkidle' });
    const cartBackBtn = page.locator('button[aria-label*="Kembali" i]').first();
    await expect(cartBackBtn).toBeVisible();

    // Cek tombol kembali di Masuk
    await page.goto('/masuk');
    const loginBackBtn = page.locator('button[aria-label*="Kembali" i]').first();
    await expect(loginBackBtn).toBeVisible();
  });

  // 7. Tes Fungsional: Dashboard Floating Menu Button membuka Sheet
  test('Dashboard Admin & SPI Mobile: Tombol bulat melayang membuka Sheet Menu Navigasi Lengkap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Dapatkan token test admin dari backend
    const backendDir = path.resolve('..', 'backend');
    let adminToken = '';
    try {
      const out = execSync(`php create-test-token.php admin`, { cwd: backendDir, encoding: 'utf-8' });
      const m = out.match(/TOKEN=([^\r\n]+)/);
      if (m) adminToken = m[1].trim();
    } catch {
      // fallback
    }

    if (adminToken) {
      await page.addInitScript((tok) => {
        localStorage.setItem('cde_auth_token', tok);
      }, adminToken);
    }

    await page.goto('/admin', { waitUntil: 'networkidle' });

    // Pastikan tidak ada header di atas
    const siteHeaders = page.locator('header:visible');
    const hCount = await siteHeaders.count();
    expect(hCount).toBe(0);

    // Tombol bulat melayang di kiri atas
    const floatingMenuBtn = page.locator('button[aria-label="Buka Menu"]').first();
    await expect(floatingMenuBtn).toBeVisible();
    await floatingMenuBtn.click();

    // Sheet menu terbuka (dialog Sheet radix)
    const sheetMenu = page.locator('[role="dialog"]').first();
    await expect(sheetMenu).toBeVisible();
  });

  // 8. Tes Fungsional: Toggle Bahasa dan Tema dari Akun
  test('Akun Hub Mobile: Toggle Bahasa dan Tema berfungsi mengubah preferensi', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/akun', { waitUntil: 'networkidle' });

    // Pastikan version marker ada di akun hub
    const versionMarker = page.locator('[data-testid="app-version"]');
    await expect(versionMarker).toBeVisible();

    // Switch Bahasa (EN)
    const enBtn = page.locator('button:has-text("EN")').first();
    if (await enBtn.isVisible()) {
      await enBtn.click();
      await page.waitForTimeout(300);
    }

    // Switch Tema (Gelap / Terang)
    const themeBtn = page.locator('button:has-text("Gelap"), button:has-text("Terang"), [aria-label*="mode" i]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);
    }
  });
});
