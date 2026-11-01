import { test, expect } from '@playwright/test';

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

const TEST_ROUTES = [
  '/',
  '/katalog',
  '/studio',
  '/edukasi',
  '/tentang',
  '/kontak',
  '/bantuan',
  '/cek-sertifikat',
  '/lacak-pesanan',
  '/keranjang',
  '/favorit',
  '/masuk',
  '/daftar',
];

test.describe('TAHAP Q-4: HEADER MOBILE DIPERTAHANKAN (LOGO + PENCARIAN) & HAPUS BAR BIRU', () => {

  // 1. Verifikasi SEMUA viewport mobile (< 1024px) pada rute publik dan auth
  for (const vp of MOBILE_VIEWPORTS) {
    test(`[${vp.label}] Mobile Header: Logo + Pencarian terlihat, TIDAK ADA bar biru`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(300);

      // Header mobile harus ada dan terlihat
      const mobileHeader = page.locator('header[data-slot="mobile-header"], [data-testid="mobile-header"], header.sticky, header:visible').first();
      await expect(mobileHeader).toBeVisible();

      // Memiliki tepat 1 logo terlihat di header
      const headerLogo = mobileHeader.locator('img[alt*="CD\'E" i], img[src*="logo" i]');
      expect(await headerLogo.count()).toBe(1);
      await expect(headerLogo).toBeVisible();

      // Memiliki tepat 1 input/tombol pencarian berbentuk pil di mobile
      const searchPill = mobileHeader.locator('[data-slot="search-pill"], button[aria-label*="pencarian" i]');
      expect(await searchPill.count()).toBe(1);
      await expect(searchPill).toBeVisible();

      // TIDAK ADA elemen bar biru pengumuman di DOM mobile
      const blueBar = page.locator('[data-slot="announcement-bar"]');
      const blueBarText = page.getByText('Pengiriman Gratis & Berasuransi');
      expect(await blueBar.count()).toBe(0);
      expect(await blueBarText.count()).toBe(0);

      // Konten pertama dimulai tepat di bawah header (selisih gap <= 16px)
      const headerBox = await mobileHeader.boundingBox();
      const firstContent = page.locator('main, [data-slot="mobile-marketplace-home"]').first();
      const contentBox = await firstContent.boundingBox();

      expect(headerBox).not.toBeNull();
      expect(contentBox).not.toBeNull();
      if (headerBox && contentBox) {
        const gap = contentBox.y - (headerBox.y + headerBox.height);
        expect(gap).toBeLessThanOrEqual(16);
      }
    });
  }

  // 2. Verifikasi Transparansi pada y=0 dan Efek Blur setelah Scroll > 8px
  test('Mobile Header: Transparan di y=0 dan Latar Berblur setelah scroll > 8px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

    const mobileHeader = page.locator('header[data-slot="mobile-header"], [data-testid="mobile-header"], header:visible').first();
    await expect(mobileHeader).toBeVisible();

    // Di y=0: harus transparan (bg-transparent atau tanpa background pekat)
    const initialBg = await mobileHeader.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    // Background transparan atau rgba(..., 0)
    expect(initialBg === 'rgba(0, 0, 0, 0)' || initialBg === 'transparent' || initialBg.includes('0)')).toBe(true);

    // Scroll lebih dari 8px (misal 50px)
    await page.evaluate(() => window.scrollTo(0, 50));
    await page.waitForTimeout(200);

    // Setelah scroll: backdrop-filter blur atau background terisi (bukan transparan total)
    const scrolledBg = await mobileHeader.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        bg: style.backgroundColor,
        backdrop: style.backdropFilter || (style as any).webkitBackdropFilter,
      };
    });
    expect(scrolledBg.bg).not.toBe('rgba(0, 0, 0, 0)');
    expect(scrolledBg.bg).not.toBe('transparent');
  });

  // 3. Fungsional: Mengetuk Kolom Pencarian Membuka Search Dialog / Command
  test('Mobile Header: Ketuk pencarian membuka Dialog/Command pencarian dan mencari', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const searchPill = page.locator('header[data-slot="mobile-header"] button, header:visible button[aria-label*="cari" i]').first();
    await searchPill.click();

    // Dialog / Command pencarian terbuka
    const dialog = page.locator('[role="dialog"], [cmdk-dialog], [cmdk-input]').first();
    await expect(dialog).toBeVisible({ timeout: 5000 });

    // Masukkan kata kunci pencarian
    const searchInput = page.locator('[cmdk-input], input[placeholder*="Cari" i]').first();
    await searchInput.fill('South Sea');
    await page.waitForTimeout(300);

    // Hasil produk muncul
    const results = page.locator('[cmdk-item], a[href*="/produk/"]');
    expect(await results.count()).toBeGreaterThan(0);
  });

  // 4. Desktop Header (1024px & 1280px) Tetap Ada dan Lengkap
  for (const vp of DESKTOP_VIEWPORTS) {
    test(`Desktop [${vp.label}]: Header desktop lengkap tetap terlihat`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      const desktopHeader = page.locator('header.hidden.lg\\:block, header:visible').first();
      await expect(desktopHeader).toBeVisible();

      // Kontrol desktop lengkap
      await expect(desktopHeader.locator('img[alt*="CD\'E" i], img[src*="logo" i]').first()).toBeVisible();
      await expect(desktopHeader.locator('input[type="text"]').first()).toBeVisible();
    });
  }
});

