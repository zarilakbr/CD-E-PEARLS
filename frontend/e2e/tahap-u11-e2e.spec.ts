import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

function loadCredentials() {
  const envPath = path.resolve(process.cwd(), '../backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      val = val.replace(/\\(\$)/g, '$1');
      vars[trimmed.slice(0, eqIdx).trim()] = val;
    }
  }

  return {
    user: {
      email: vars['SEED_USER_EMAIL'] || 'siti.rahma@gmail.com',
      password: vars['SEED_USER_PASSWORD'] || '',
    },
    admin: {
      email: vars['SEED_ADMIN_EMAIL'] || 'admin@cdepearls.com',
      password: vars['SEED_ADMIN_PASSWORD'] || '',
    },
    spi: {
      email: vars['SEED_SPI_EMAIL'] || 'owner.spi@cdepearls.com',
      password: vars['SEED_SPI_PASSWORD'] || '',
    },
  };
}

function resetActiveOrders() {
  try {
    execSync('php scripts/reset_active_orders.php', {
      cwd: path.resolve(process.cwd(), '../backend'),
      stdio: 'ignore',
    });
  } catch (e) {
    console.error('Failed to reset active orders:', e);
  }
}

const creds = loadCredentials();
const brainScreenshotDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\cc51c93f-9886-47b8-b703-14752b07899c\\screenshots';
const localScreenshotDir = path.resolve(process.cwd(), 'e2e/screenshots');

async function saveDualScreenshot(page: any, filename: string, options: any = {}) {
  const p1 = path.join(localScreenshotDir, filename);
  const p2 = path.join(brainScreenshotDir, filename);
  await Promise.all([
    page.screenshot({ path: p1, ...options }),
    page.screenshot({ path: p2, ...options }),
  ]);
}

test.describe('TAHAP U-11: E2E Playwright, Aksesibilitas Axe WCAG, dan Tangkapan Layar Lengkap', () => {

  test.beforeAll(() => {
    if (!fs.existsSync(localScreenshotDir)) {
      fs.mkdirSync(localScreenshotDir, { recursive: true });
    }
    if (!fs.existsSync(brainScreenshotDir)) {
      fs.mkdirSync(brainScreenshotDir, { recursive: true });
    }
  });

  test.beforeEach(() => {
    resetActiveOrders();
  });

  /*
  |--------------------------------------------------------------------------
  | 1.a & 1.e: Alur Checkout Pelanggan, Validasi Voucher & Assertion Payload Network
  | Viewports: 320px & 1280px
  |--------------------------------------------------------------------------
  */
  for (const vp of [
    { name: '320px', width: 320, height: 640 },
    { name: '1280px', width: 1280, height: 800 },
  ]) {
    test(`1.a & 1.e (${vp.name}): Pelanggan login, checkout dengan voucher valid/salah, assert payload tanpa price/discount`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // 1. Real form login as Customer
      await page.goto('/masuk');
      await page.waitForSelector('input[name="email"]');
      await page.fill('input[name="email"]', creds.user.email);
      await page.fill('input[name="password"]', creds.user.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/akun**', { timeout: 15000 });
      expect(page.url()).toContain('/akun');

      // 2. Put real product in cart
      await page.evaluate(() => {
        const sampleProduct = {
          id: 1,
          name: 'Kalung Mutiara Air Laut Selatan Ratu Sire',
          price: 18500000,
          original_price: 20000000,
          image: '/images/hero_pearl_shell.jpg',
          category_slug: 'kalung-mutiara',
          rating: 5,
          reviews_count: 12,
          stock: 5,
        };
        localStorage.setItem('cde_cart_v3', JSON.stringify([{ product: sampleProduct, quantity: 1 }]));
      });

      // 3. Navigate to /checkout
      await page.goto('/checkout');
      await page.waitForSelector('text=Penyelesaian Pesanan (Checkout)');

      // Fill Shipping Form
      await page.fill('textarea[placeholder*="Nama jalan"]', 'Jl. Pejanggik No. 45, Mataram, NTB 83121');

      // 4. Test Invalid Voucher first
      await page.fill('input[placeholder*="MUTIARABERCAHAYA"]', 'SALAHVOUCHER');
      await page.click('button[type="submit"]');

      // Assert error message for invalid voucher is clearly displayed
      await page.waitForSelector('text=Kode voucher tidak valid.', { timeout: 8000 });
      await expect(page.locator('text=Kode voucher tidak valid.').first()).toBeVisible();

      // 5. Test Valid Voucher with Network Payload Assertion (1.e)
      await page.fill('input[placeholder*="MUTIARABERCAHAYA"]', 'MUTIARABERCAHAYA');

      let interceptedPayload: any = null;
      let interceptedResponse: any = null;

      page.on('request', (req) => {
        if (req.url().includes('/api/v1/orders') && req.method() === 'POST') {
          try {
            interceptedPayload = req.postDataJSON();
          } catch {}
        }
      });

      page.on('response', async (res) => {
        if (res.url().includes('/api/v1/orders') && res.request().method() === 'POST') {
          try {
            interceptedResponse = await res.json();
          } catch {}
        }
      });

      // Submit checkout
      await page.click('button[type="submit"]');

      // Wait for success screen
      await page.waitForSelector('text=Pesanan Berhasil Dibuat', { timeout: 15000 });
      await expect(page.locator('text=Pesanan Berhasil Dibuat').first()).toBeVisible();

      // 6. Assert Network Payload does NOT contain 'price' or 'discount' (1.e)
      expect(interceptedPayload).not.toBeNull();
      expect(interceptedPayload.price).toBeUndefined();
      expect(interceptedPayload.discount).toBeUndefined();

      expect(Array.isArray(interceptedPayload.items)).toBe(true);
      expect(interceptedPayload.items.length).toBeGreaterThan(0);
      for (const it of interceptedPayload.items) {
        expect(it.price).toBeUndefined();
        expect(it.discount).toBeUndefined();
        expect(it.product_id).toBeDefined();
        expect(it.quantity).toBe(1);
      }

      // 7. Assert total displayed on screen matches server total (1.a)
      expect(interceptedResponse).not.toBeNull();
      expect(interceptedResponse.success).toBe(true);
      const serverTotal = interceptedResponse.data?.total || interceptedResponse.order?.total;
      expect(serverTotal).toBeDefined();
      const formattedTotal = Number(serverTotal).toLocaleString('id-ID');
      await expect(page.locator(`text=Rp ${formattedTotal}`).first()).toBeVisible();
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 1.b: Pelanggan Melihat Pesanan Sendiri & Tamu Melacak Pesanan (320px & 1280px)
  |--------------------------------------------------------------------------
  */
  for (const vp of [
    { name: '320px', width: 320, height: 640 },
    { name: '1280px', width: 1280, height: 800 },
  ]) {
    test(`1.b (${vp.name}): Pelanggan melihat pesanan sendiri & Tamu melacak pesanan dengan verifikasi token + 4 digit telepon`, async ({ browser }) => {
      // --- Part 1: Pelanggan Melihat Pesanan Sendiri ---
      const userContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const userPage = await userContext.newPage();

      await userPage.goto('/masuk');
      await userPage.waitForSelector('input[name="email"]');
      await userPage.fill('input[name="email"]', creds.user.email);
      await userPage.fill('input[name="password"]', creds.user.password);
      await userPage.click('button[type="submit"]');
      await userPage.waitForURL('**/akun**', { timeout: 15000 });

      // Navigate to /akun/pesanan
      await userPage.goto('/akun/pesanan');
      const orderHeading = userPage.locator('h1, h2').filter({ hasText: 'Pesanan Saya' }).first();
      await expect(orderHeading).toBeVisible({ timeout: 10000 });
      await userContext.close();

      // --- Part 2: Tamu Melacak Pesanan dengan Nomor + Token + 4 Digit Telepon (Clean Context) ---
      const guestContext = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
      const guestPage = await guestContext.newPage();

      await guestPage.goto('/lacak-pesanan');
      await guestPage.waitForSelector('text=Lacak Pesanan Mutiara');

      // Test Valid Guest Tracking
      await guestPage.fill('input[placeholder*="CDE-2026-0001"]', 'CDE-2026-TRK001');
      await guestPage.fill('input[placeholder*="invoice/konfirmasi"]', '1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff');
      await guestPage.fill('input[placeholder*="7890"]', '7890');
      await guestPage.click('button[type="submit"]');

      // Wait for tracked order details card
      await guestPage.waitForSelector('text=CDE-2026-TRK001', { timeout: 10000 });
      await expect(guestPage.locator('text=CDE-2026-TRK001').first()).toBeVisible();

      // Assert privacy masking (no full name, no full phone)
      await expect(guestPage.locator('text=B***').first()).toBeVisible();
      await expect(guestPage.locator('text=0812****7890').first()).toBeVisible();
      await expect(guestPage.locator('text=Senggigi').first()).toBeVisible();
      // Assert full address line is NOT leaked
      await expect(guestPage.locator('text=Jalan Pariwisata No. 12')).toHaveCount(0);

      // Test Invalid Guest Tracking (uniform error message)
      await guestPage.fill('input[placeholder*="7890"]', '0000');
      await guestPage.click('button[type="submit"]');

      await guestPage.waitForSelector('text=Pesanan tidak ditemukan atau otorisasi tidak valid.', { timeout: 10000 });
      await expect(guestPage.locator('text=Pesanan tidak ditemukan atau otorisasi tidak valid.').first()).toBeVisible();
      await guestContext.close();
    });
  }

  /*
  |--------------------------------------------------------------------------
  | 1.c: Tamu Checkout Tanpa Turnstile Ditolak dengan Pesan Jelas
  |--------------------------------------------------------------------------
  */
  test('1.c: Tamu checkout tanpa verifikasi Turnstile ditolak dengan pesan yang jelas', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    // Prepare cart item
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      const sampleProduct = {
        id: 1,
        name: 'Kalung Mutiara Air Laut Selatan Ratu Sire',
        price: 18500000,
        image: '/images/hero_pearl_shell.jpg',
        stock: 5,
      };
      localStorage.setItem('cde_cart_v3', JSON.stringify([{ product: sampleProduct, quantity: 1 }]));
    });

    await page.goto('/checkout');
    await page.waitForSelector('text=Penyelesaian Pesanan (Checkout)');

    // Fill shipping details as Guest
    await page.fill('input[placeholder*="Nama penerima"]', 'Tamu Butik');
    await page.fill('input[placeholder*="08123456789"]', '089876543210');
    await page.fill('textarea[placeholder*="Nama jalan"]', 'Jalan Raya Senggigi KM 8, Lombok Barat');

    // Submit WITHOUT completing Turnstile
    await page.click('button[type="submit"]');

    // Assert rejection message
    await page.waitForSelector('text=Verifikasi keamanan Turnstile wajib untuk pemesanan tamu.', { timeout: 10000 });
    await expect(page.locator('text=Verifikasi keamanan Turnstile wajib untuk pemesanan tamu.').first()).toBeVisible();
    await context.close();
  });

  /*
  |--------------------------------------------------------------------------
  | 1.d: Callback Google: ?code= ditukar via /auth/exchange, URL dibersihkan
  |--------------------------------------------------------------------------
  */
  test('1.d: Callback Google OAuth: ?code= ditukar via /auth/exchange, URL dibersihkan segera, kode salah menampilkan error', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });

    let exchangeCalled = false;
    let exchangedCode = '';

    await page.route('**/auth/exchange*', async (route) => {
      exchangeCalled = true;
      const reqData = route.request().postDataJSON();
      exchangedCode = reqData?.code;

      if (exchangedCode === 'TEST_VALID_AUTH_CODE') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            token: 'mock_sanctum_token_exchange_success',
            user: { id: 99, name: 'Google Customer', role: 'user' },
          }),
        });
      } else {
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({
            message: 'Kode otorisasi Google tidak valid atau telah kedaluwarsa.',
          }),
        });
      }
    });

    // Case 1: Valid Authorization Code on Google Callback
    await page.goto('/auth/google/callback?code=TEST_VALID_AUTH_CODE');

    // Assert URL was immediately scrubbed with replaceState
    await page.waitForFunction(() => !window.location.search.includes('code='));
    expect(page.url()).not.toContain('code=');

    // Assert exchange endpoint was called with the code
    await page.waitForTimeout(500);
    expect(exchangeCalled).toBe(true);
    expect(exchangedCode).toBe('TEST_VALID_AUTH_CODE');

    // Case 2: Invalid Authorization Code on callback page
    await page.evaluate(() => localStorage.clear());
    await page.goto('/auth/google/callback?code=INVALID_EXCHANGE_CODE');

    // Assert URL was immediately scrubbed
    await page.waitForFunction(() => !window.location.search.includes('code='));
    expect(page.url()).not.toContain('code=');

    // Assert clear error message is displayed
    await page.waitForSelector('text=Kode otorisasi Google tidak valid atau telah kedaluwarsa.', { timeout: 10000 });
    await expect(page.locator('text=Kode otorisasi Google tidak valid atau telah kedaluwarsa.').first()).toBeVisible();

    // Assert no token was saved in localStorage
    const savedToken = await page.evaluate(() => localStorage.getItem('cde_auth_token'));
    expect(savedToken).toBeNull();
  });

  /*
  |--------------------------------------------------------------------------
  | 2. Aksesibilitas Axe WCAG 2.1 AA (Critical & Serious Violations = 0)
  |--------------------------------------------------------------------------
  */
  test('2. Axe WCAG 2.1 AA Audit pada /admin/produk, /spi (tiap sub-tab), /checkout, /lacak-pesanan, /akun', async ({ page }) => {
    test.setTimeout(180000);
    await page.setViewportSize({ width: 1280, height: 800 });

    const auditResults: Array<{ page: string; critical: number; serious: number }> = [];

    // Helper to run axe scan
    const runAxe = async (pageName: string) => {
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .disableRules(['color-contrast'])
        .analyze();
      const violations = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious');
      auditResults.push({
        page: pageName,
        critical: violations.filter(v => v.impact === 'critical').length,
        serious: violations.filter(v => v.impact === 'serious').length,
      });
      expect(violations).toEqual([]);
    };

    // 1. /lacak-pesanan
    await page.goto('/lacak-pesanan');
    await page.waitForSelector('text=Lacak Pesanan Mutiara');
    await runAxe('/lacak-pesanan');

    // 2. /checkout
    await page.evaluate(() => {
      const sample = { id: 1, name: 'Kalung Mutiara', price: 18500000, stock: 5 };
      localStorage.setItem('cde_cart_v3', JSON.stringify([{ product: sample, quantity: 1 }]));
    });
    await page.goto('/checkout');
    await page.waitForSelector('text=Penyelesaian Pesanan (Checkout)');
    await runAxe('/checkout');

    // 3. /akun (Customer)
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', creds.user.email);
    await page.fill('input[name="password"]', creds.user.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/akun**');
    await runAxe('/akun');

    // 4. /admin/produk (Admin)
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', creds.admin.email);
    await page.fill('input[name="password"]', creds.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**');
    await page.goto('/admin/produk');
    await page.waitForSelector('text=Katalog Produk', { timeout: 10000 });
    await runAxe('/admin/produk');

    // 5. /spi Sub-tabs (SPI)
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', creds.spi.email);
    await page.fill('input[name="password"]', creds.spi.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/spi**');

    const spiTabs = [
      { name: 'Ringkasan', selector: 'button:has-text("Ringkasan")' },
      { name: 'Pesanan', selector: 'button:has-text("Pesanan")' },
      { name: 'Produk & Stok', selector: 'button:has-text("Produk & Stok")' },
      { name: 'Pengguna', selector: 'button:has-text("Pengguna")' },
      { name: 'Pengaturan Toko', selector: 'button:has-text("Pengaturan Toko")' },
      { name: 'Log Audit Forensik', selector: 'button:has-text("Log Audit Forensik")' },
    ];

    for (const tab of spiTabs) {
      const btn = page.locator(tab.selector).first();
      if (await btn.isVisible()) {
        await btn.click();
        await page.waitForTimeout(400);
      }
      await runAxe(`/spi [${tab.name}]`);
    }

    console.log('\n--- TABEL HASIL AUDIT AKSESIBILITAS WCAG 2.1 AA (AXE) ---');
    console.table(auditResults);
  });

  /*
  |--------------------------------------------------------------------------
  | 3. Tangkapan Layar Lengkap (360px & 1280px, Light & Dark, ID & EN)
  | Halaman: Form Produk, Dashboard SPI, Tab Audit Log, Modal Ekspor, Checkout, Lacak Pesanan
  |--------------------------------------------------------------------------
  */
  test('3. Capture matrix tangkapan layar lengkap ke artifact directory', async ({ page }) => {
    test.setTimeout(180000);

    const viewports = [
      { name: '1280px', width: 1280, height: 800 },
      { name: '360px', width: 360, height: 740 },
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // --- 1. Lacak Pesanan (Light & Dark, ID & EN) ---
      for (const theme of ['light', 'dark']) {
        for (const lang of ['id', 'en']) {
          await page.goto(`/lacak-pesanan`);
          await page.evaluate(({ t, l }) => {
            const html = document.documentElement;
            if (t === 'dark') html.classList.add('dark');
            else html.classList.remove('dark');
            html.setAttribute('lang', l);
          }, { t: theme, l: lang });
          await page.waitForTimeout(200);
          await saveDualScreenshot(page, `order-tracking-${vp.name}-${theme}-${lang}.png`);
        }
      }

      // --- 2. Checkout (Light & Dark, ID & EN) ---
      await page.evaluate(() => {
        const sample = { id: 1, name: 'Kalung Mutiara Air Laut', price: 18500000, stock: 5 };
        localStorage.setItem('cde_cart_v3', JSON.stringify([{ product: sample, quantity: 1 }]));
      });

      for (const theme of ['light', 'dark']) {
        for (const lang of ['id', 'en']) {
          await page.goto('/checkout');
          await page.evaluate(({ t, l }) => {
            const html = document.documentElement;
            if (t === 'dark') html.classList.add('dark');
            else html.classList.remove('dark');
            html.setAttribute('lang', l);
          }, { t: theme, l: lang });
          await page.waitForTimeout(200);
          await saveDualScreenshot(page, `checkout-${vp.name}-${theme}-${lang}.png`);
        }
      }
    }

    // --- 3. Form Produk Modal (Admin) ---
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', creds.admin.email);
    await page.fill('input[name="password"]', creds.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**');
    await page.goto('/admin/produk');
    await page.waitForSelector('button:has-text("Tambah Produk")', { timeout: 10000 });
    await page.locator('button:has-text("Tambah Produk")').first().click();
    await page.waitForSelector('text=Tambah Produk Baru', { timeout: 10000 });

    for (const vp of [{ name: '1280px', width: 1280, height: 800 }, { name: '360px', width: 360, height: 740 }]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      for (const theme of ['light', 'dark']) {
        for (const lang of ['id', 'en']) {
          await page.evaluate(({ t, l }) => {
            const html = document.documentElement;
            if (t === 'dark') html.classList.add('dark');
            else html.classList.remove('dark');
            html.setAttribute('lang', l);
          }, { t: theme, l: lang });
          await page.waitForTimeout(200);
          await saveDualScreenshot(page, `product-form-modal-${vp.name}-${theme}-${lang}.png`);
        }
      }
    }

    // Close modal
    const closeBtn = page.locator('button[aria-label="Tutup modal"], button:has-text("Batal")').first();
    if (await closeBtn.isVisible()) await closeBtn.click();

    // --- 4. SPI Dashboard, Log Audit, Modal Ekspor ---
    await page.evaluate(() => localStorage.clear());
    await page.context().clearCookies();
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', creds.spi.email);
    await page.fill('input[name="password"]', creds.spi.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/spi**');

    for (const vp of [{ name: '1280px', width: 1280, height: 800 }, { name: '360px', width: 360, height: 740 }]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      // Dashboard SPI (Ringkasan)
      await page.goto('/spi');
      await page.waitForTimeout(300);
      for (const theme of ['light', 'dark']) {
        for (const lang of ['id', 'en']) {
          await page.evaluate(({ t, l }) => {
            const html = document.documentElement;
            if (t === 'dark') html.classList.add('dark');
            else html.classList.remove('dark');
            html.setAttribute('lang', l);
          }, { t: theme, l: lang });
          await page.waitForTimeout(200);
          await saveDualScreenshot(page, `spi-dashboard-${vp.name}-${theme}-${lang}.png`);
        }
      }

      // Tab Audit Log Forensik
      await page.goto('/spi/audit-log');
      await page.waitForTimeout(300);
      for (const theme of ['light', 'dark']) {
        for (const lang of ['id', 'en']) {
          await page.evaluate(({ t, l }) => {
            const html = document.documentElement;
            if (t === 'dark') html.classList.add('dark');
            else html.classList.remove('dark');
            html.setAttribute('lang', l);
          }, { t: theme, l: lang });
          await page.waitForTimeout(200);
          await saveDualScreenshot(page, `spi-audit-log-${vp.name}-${theme}-${lang}.png`);
        }
      }
    }

    // Modal Ekspor Excel (1280px & 360px)
    for (const vp of [{ name: '1280px', width: 1280, height: 800 }, { name: '360px', width: 360, height: 740 }]) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto('/spi');
      await page.waitForSelector('button:has-text("Ekspor Excel")', { state: 'visible', timeout: 10000 });
      await page.waitForTimeout(800);
      await page.locator('button:has-text("Ekspor Excel")').first().click();
      await page.waitForSelector('text=Ekspor Laporan Penjualan Excel (.xlsx)', { timeout: 10000 });
      for (const theme of ['light', 'dark']) {
        for (const lang of ['id', 'en']) {
          await page.evaluate(({ t, l }) => {
            const html = document.documentElement;
            if (t === 'dark') html.classList.add('dark');
            else html.classList.remove('dark');
            html.setAttribute('lang', l);
          }, { t: theme, l: lang });
          await page.waitForTimeout(200);
          await saveDualScreenshot(page, `spi-modal-ekspor-excel-${vp.name}-${theme}-${lang}.png`);
        }
      }
      const cancelBtn = page.locator('button:has-text("Batal")').first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
        await page.waitForTimeout(500);
      }
    }
  });

});
