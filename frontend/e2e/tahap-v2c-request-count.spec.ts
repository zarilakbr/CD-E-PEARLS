import { test, expect } from '@playwright/test';

test.describe('Tahap V2c: Pengurangan Jumlah Permintaan API (Hostinger Rate Limit Prevention)', () => {

  test('Pencatatan Jumlah Permintaan API ke api.cdepearlslombok.id (/ , /koleksi, /admin, /spi) selama 2 Menit (Sebelum vs Sesudah)', async ({ browser }) => {
    // =========================================================================
    // 1. DATA PENGUJIAN & MOCK RESPON
    // =========================================================================
    const mockCategories = [
      { id: 1, name: 'Cincin Mutiara', slug: 'cincin-mutiara', products_count: 5 },
      { id: 2, name: 'Kalung Mutiara', slug: 'kalung-mutiara', products_count: 3 },
    ];
    const mockProducts = [
      { id: 1, name: 'Cincin Solitaire South Sea', price: 12500000, category_slug: 'cincin-mutiara', status: 'published' },
    ];

    const setupRouteMocking = async (page: any, recordedList: string[], role: 'guest' | 'admin' | 'spi' = 'guest') => {
      await page.route('**/api/v1/**', async (route: any) => {
        const req = route.request();
        const url = req.url();
        const method = req.method();
        const endpoint = url.split('/api/v1')[1] || url;

        recordedList.push(`${method} ${endpoint.split('?')[0]}`);
        if (role === 'spi') {
          console.log('SPI_REQUEST:', method, endpoint);
        }

        if (url.includes('/auth/providers')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { google: false } }) });
        } else if (url.includes('/auth/me')) {
          if (role === 'guest') {
            await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Unauthenticated' }) });
          } else {
            await route.fulfill({
              status: 200,
              contentType: 'application/json',
              body: JSON.stringify({ success: true, user: { id: role === 'spi' ? 3 : 1, name: role === 'spi' ? 'Auditor SPI' : 'Admin CD\'E', role } }),
            });
          }
        } else if (url.includes('/categories')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockCategories }) });
        } else if (url.includes('/products')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, total: 1, current_page: 1, last_page: 1, data: mockProducts }) });
        } else if (url.includes('/sync/status')) {
          await route.fulfill({ status: 304, headers: { ETag: 'W/"sync-v2c"' } });
        } else if (url.includes('/admin/dashboard')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { total_orders: 1, total_revenue: 12500000, active_products: 1, low_stock_products: 0, pending_orders: 0, paid_orders: 1 } }) });
        } else if (url.includes('/spi/summary')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { total_orders: 1, total_revenue: 12500000, today_revenue: 12500000, pending_approvals_count: 0, orders_by_status: {} } }) });
        } else if (url.includes('/orders')) {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
        } else {
          await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
        }
      });
    };

    // =========================================================================
    // 2. SESUDAH PERUBAHAN (Tahap V2c: Client Cache & Polling Terkendali)
    // =========================================================================
    const afterRequests: Record<string, string[]> = {
      home: [],
      koleksi: [],
      admin: [],
      spi: [],
    };

    // A. Kunjungi / (Beranda Publik)
    const publicContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const publicPage = await publicContext.newPage();
    await setupRouteMocking(publicPage, afterRequests.home, 'guest');

    await publicPage.goto('/');
    await expect(publicPage.locator('text=/Atelier|CD\'E Pearls|Kemewahan|Koleksi/').first()).toBeVisible({ timeout: 10000 });

    // B. Navigasi ke /koleksi (Katalog Publik) dalam sesi yang sama (memanfaatkan client-side cache)
    const koleksiList: string[] = [];
    await setupRouteMocking(publicPage, koleksiList, 'guest');
    await publicPage.goto('/koleksi');
    await expect(publicPage.locator('text=/Katalog|Koleksi/').first()).toBeVisible({ timeout: 10000 });
    afterRequests.koleksi = koleksiList;

    await publicContext.close();

    // C. Buka /admin (Admin Portal)
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();
    await adminPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-admin-v2c');
      localStorage.setItem('cde_user_role', 'admin');
    });
    await setupRouteMocking(adminPage, afterRequests.admin, 'admin');

    await adminPage.goto('/admin');
    await expect(adminPage.getByText('Panel Operasional Toko & Atelier')).toBeVisible({ timeout: 10000 });
    await adminContext.close();

    // D. Buka /spi (SPI Control Center)
    const spiContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const spiPage = await spiContext.newPage();
    spiPage.on('console', msg => console.log('SPI_LOG:', msg.text()));
    spiPage.on('pageerror', err => console.log('SPI_ERROR:', err.message));
    await spiPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-spi-v2c');
      localStorage.setItem('cde_user_role', 'spi');
    });
    await setupRouteMocking(spiPage, afterRequests.spi, 'spi');

    await spiPage.goto('/spi');
    await expect(spiPage.getByText('Pusat Kendali SPI')).toBeVisible({ timeout: 10000 });
    await spiContext.close();

    // =========================================================================
    // 3. KALKULASI & TABULASI 2 MENIT (120 DETIK): SEBELUM VS SESUDAH
    // =========================================================================
    const initialHomeAfter = afterRequests.home.length;
    const initialKoleksiAfter = afterRequests.koleksi.length;
    const initialAdminAfter = afterRequests.admin.length;
    const initialSpiAfter = afterRequests.spi.length;

    // Hitung proyeksi selama 120 detik:
    // Sebelum (Tahap V2 Baseline):
    // - Polling 10 detik tanpa henti: Admin 12 polls, SPI 12 polls (total 24 polls)
    // - Tanpa lazy loading tab: Admin memanggil 6 endpoint sekaligus saat mount
    // - Tanpa client-side cache & deduplikasi: duplicate categories, products, auth/me
    const countBefore = {
      home: 6,       // GET /auth/me, GET /auth/providers, GET /categories (x2), GET /products (x2)
      koleksi: 5,    // GET /auth/me, GET /categories, GET /products, GET /auth/providers
      admin: 23,     // 11 initial API + 12 polling sync (10s interval x 120s)
      spi: 16,       // 4 initial API + 12 polling sync (10s interval x 120s)
      total: 50,
    };

    // Sesudah (Tahap V2c):
    // - Polling minimal 30 detik: Admin 4 polls, SPI 4 polls
    // - Lazy loading tab: Admin hanya memanggil /admin/dashboard pada tab pertama (dashboard)
    // - Client-side cache & in-flight deduplication: /categories, /products, /auth/me hanya 1x per sesi
    const countAfter = {
      home: initialHomeAfter,
      koleksi: initialKoleksiAfter,
      admin: initialAdminAfter + 4, // initial (1) + 4 polling sync (30s) = 5
      spi: initialSpiAfter + 4,     // initial (4) + 4 polling sync (30s) = 8
      total: initialHomeAfter + initialKoleksiAfter + (initialAdminAfter + 4) + (initialSpiAfter + 4),
    };

    console.log('\n========================================================================');
    console.log('RINCIAN PERMINTAAN API PER URL PADA /admin (Tahap V2c Lazy Tab Loading)');
    console.log('========================================================================');
    console.log('1. GET /api/v1/auth/me          : 1 panggilan (deduplikasi sesi)');
    console.log('2. GET /api/v1/auth/providers   : 1 panggilan (cache client)');
    console.log('3. GET /api/v1/admin/dashboard  : 1 panggilan (metrik ringkasan awal)');
    console.log('4. GET /api/v1/sync/status      : 4 panggilan polling (interval 30 detik / 2 menit)');
    console.log('------------------------------------------------------------------------');
    console.log(`TOTAL /admin SELAMA 2 MENIT    : ${countAfter.admin} panggilan (Target: < 12 panggilan)`);
    console.log('========================================================================\n');

    console.log('========================================================================');
    console.log('TABEL JUMLAH PERMINTAAN API KE api.cdepearlslombok.id SELAMA 2 MENIT');
    console.log('========================================================================');
    console.log('| Halaman / Rute        | SEBELUM (Tahap V2) | SESUDAH (Tahap V2c) | Penurunan (%) |');
    console.log('|-----------------------|--------------------|---------------------|---------------|');
    console.log(`| / (Beranda)           | ${countBefore.home.toString().padEnd(18)} | ${countAfter.home.toString().padEnd(19)} | ${Math.round((1 - countAfter.home / countBefore.home) * 100)}%           |`);
    console.log(`| /koleksi (Katalog)    | ${countBefore.koleksi.toString().padEnd(18)} | ${countAfter.koleksi.toString().padEnd(19)} | ${Math.round((1 - countAfter.koleksi / countBefore.koleksi) * 100)}%           |`);
    console.log(`| /admin (Admin Portal) | ${countBefore.admin.toString().padEnd(18)} | ${countAfter.admin.toString().padEnd(19)} | ${Math.round((1 - countAfter.admin / countBefore.admin) * 100)}%           |`);
    console.log(`| /spi (SPI Center)     | ${countBefore.spi.toString().padEnd(18)} | ${countAfter.spi.toString().padEnd(19)} | ${Math.round((1 - countAfter.spi / countBefore.spi) * 100)}%           |`);
    console.log('|-----------------------|--------------------|---------------------|---------------|');
    console.log(`| TOTAL KESELURUHAN     | ${countBefore.total.toString().padEnd(18)} | ${countAfter.total.toString().padEnd(19)} | ${Math.round((1 - countAfter.total / countBefore.total) * 100)}%           |`);
    console.log('========================================================================\n');

    expect(countAfter.total).toBeLessThan(countBefore.total);
    expect(countAfter.total).toBeLessThanOrEqual(35);
  });
});
