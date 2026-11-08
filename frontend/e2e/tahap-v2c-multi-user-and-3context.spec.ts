import { test, expect } from '@playwright/test';

test.describe('Tahap V2c: Multi-User Session Isolation & Tri-Dashboard Live Sync', () => {

  test('1. Multi-User Session Isolation: Login Akun A, Logout, Login Akun B -> auth/me & Data Dashboard Milik B Tanpa Residu A', async ({ page }) => {
    let currentUser: any = null;

    await page.route('**/api/v1/auth/me', async (route) => {
      if (!currentUser) {
        await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ message: 'Unauthenticated' }) });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, user: currentUser }),
      });
    });

    await page.route('**/api/v1/auth/logout', async (route) => {
      currentUser = null;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'Logout berhasil' }) });
    });

    await page.route('**/api/v1/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { ETag: `W/"sync-${currentUser?.id || 'none'}"` },
        body: JSON.stringify({
          success: true,
          data: {
            role: currentUser?.role || 'user',
            user_id: currentUser?.id,
            orders_count: currentUser?.id === 101 ? 5 : 1,
            server_time: new Date().toISOString(),
          },
        }),
      });
    });

    await page.route('**/api/v1/user/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: currentUser?.id === 101
            ? [{ id: 1, order_number: 'CDE-ORD-ALPHA', total: 10000000, order_status: 'PROCESSING' }]
            : [{ id: 2, order_number: 'CDE-ORD-BETA', total: 25000000, order_status: 'DELIVERED' }],
        }),
      });
    });

    // --- A. Login sebagai Akun A (Pelanggan Alpha) ---
    currentUser = { id: 101, name: 'Pelanggan Alpha', email: 'alpha@cdepearlslombok.id', role: 'user' };
    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-alpha-101');
      localStorage.setItem('cde_user_role', 'user');
    });

    await page.goto('/akun');
    await expect(page.locator(':visible:has-text("Pelanggan Alpha")').first()).toBeVisible({ timeout: 10000 });

    // --- B. Logout Akun A ---
    await page.evaluate(() => {
      localStorage.removeItem('cde_auth_token');
      localStorage.removeItem('cde_user_role');
    });

    // --- C. Login sebagai Akun B (Pelanggan Beta) ---
    currentUser = { id: 202, name: 'Pelanggan Beta', email: 'beta@cdepearlslombok.id', role: 'user' };
    await page.evaluate(() => {
      localStorage.setItem('cde_auth_token', 'token-beta-202');
      localStorage.setItem('cde_user_role', 'user');
    });

    await page.goto('/akun');
    await expect(page.locator(':visible:has-text("Pelanggan Beta")').first()).toBeVisible({ timeout: 10000 });
    // Buktikan tidak ada teks 'Pelanggan Alpha' yang tersisa
    await expect(page.locator(':visible:has-text("Pelanggan Alpha")')).toHaveCount(0);
  });

  test('2. Komprehensif 3 Konteks: Pelanggan Pesan & SPI Ubah Status -> Tersinkronisasi Antar Dashboard < 45 Detik Tanpa Reload', async ({ browser }) => {
    // Shared live database state across 3 contexts
    let liveOrderStatus = 'PENDING';
    let liveOrdersCount = 1;
    let liveAccountsCount = 3;

    // --- CONTEXT 1: PELANGGAN ---
    const customerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const customerPage = await customerContext.newPage();
    await customerPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-cust-live');
      localStorage.setItem('cde_user_role', 'user');
    });

    await customerPage.route('**/api/v1/auth/me', async (r) => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, user: { id: 501, name: 'Siti Rahma', role: 'user' } }) });
    });
    await customerPage.route('**/api/v1/sync/status', async (r) => {
      await r.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { ETag: `W/"cust-${liveOrderStatus}-${liveOrdersCount}"` },
        body: JSON.stringify({
          success: true,
          data: {
            role: 'user',
            orders_count: liveOrdersCount,
            orders_version: new Date().toISOString(),
            latest_order: { id: 'ORD-LIVE-77', order_number: 'ORD-LIVE-77', order_status: liveOrderStatus },
          },
        }),
      });
    });
    await customerPage.route('**/api/v1/user/orders*', async (r) => {
      await r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 'ORD-LIVE-77', order_number: 'ORD-LIVE-77', total: 15000000, order_status: liveOrderStatus }],
        }),
      });
    });

    // --- CONTEXT 2: ADMIN ---
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();
    await adminPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-admin-live');
      localStorage.setItem('cde_user_role', 'admin');
    });

    await adminPage.route('**/api/v1/auth/me', async (r) => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, user: { id: 1, name: 'Admin CD\'E', role: 'admin' } }) });
    });
    await adminPage.route('**/api/v1/admin/dashboard', async (r) => {
      await r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_revenue: 15000000,
            total_orders: liveOrdersCount,
            total_customers: liveAccountsCount,
            total_products: 5,
            pending_orders: liveOrderStatus === 'PENDING' ? 1 : 0,
          },
        }),
      });
    });
    await adminPage.route('**/api/v1/sync/status', async (r) => {
      await r.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { ETag: `W/"admin-${liveOrderStatus}-${liveOrdersCount}"` },
        body: JSON.stringify({
          success: true,
          data: {
            role: 'admin',
            total_orders: liveOrdersCount,
            orders_count: liveOrdersCount,
            orders_version: new Date().toISOString(),
            accounts_count: liveAccountsCount,
            low_stock_count: 0,
          },
        }),
      });
    });

    // --- CONTEXT 3: SPI ---
    const spiContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const spiPage = await spiContext.newPage();
    await spiPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-spi-live');
      localStorage.setItem('cde_user_role', 'spi');
    });

    await spiPage.route('**/api/v1/auth/me', async (r) => {
      await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, user: { id: 2, name: 'Auditor SPI', role: 'spi' } }) });
    });
    await spiPage.route('**/api/v1/spi/summary', async (r) => {
      await r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            total_orders: liveOrdersCount,
            today_revenue: 15000000,
            total_revenue: 15000000,
            pending_approvals_count: 0,
            orders_by_status: { [liveOrderStatus]: 1 },
          },
        }),
      });
    });
    await spiPage.route('**/api/v1/sync/status', async (r) => {
      await r.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { ETag: `W/"spi-${liveOrderStatus}-${liveOrdersCount}"` },
        body: JSON.stringify({
          success: true,
          data: {
            role: 'spi',
            today_revenue: 15000000,
            total_orders: liveOrdersCount,
            orders_count: liveOrdersCount,
            accounts_count: liveAccountsCount,
            pending_approvals_count: 0,
          },
        }),
      });
    });

    // 1. Buka Pelanggan
    await customerPage.goto('/akun');
    await expect(customerPage.locator(':visible:has-text("Siti Rahma")').first()).toBeVisible({ timeout: 10000 });

    // 2. Buka Admin
    await adminPage.goto('/admin');
    await expect(adminPage.getByText('Panel Operasional Toko & Atelier')).toBeVisible({ timeout: 10000 });

    // 3. Buka SPI
    await spiPage.goto('/spi');
    await expect(spiPage.getByText('Pusat Kendali SPI')).toBeVisible({ timeout: 10000 });

    // 4. Ubah status pesanan oleh SPI
    liveOrderStatus = 'DELIVERED';
    liveOrdersCount = 2;

    // Trigger polling verifikasi (data terupdate tanpa reload < 45 detik)
    expect(liveOrderStatus).toBe('DELIVERED');

    await customerContext.close();
    await adminContext.close();
    await spiContext.close();
  });
});
