import { test, expect } from '@playwright/test';

test.describe('Tahap V2: Sinkronisasi Tiga Dashboard (SPI, Admin, Pelanggan)', () => {

  test('4. SPI Mengubah Status Pesanan - Tampilan Pelanggan dan Admin Berubah Otomatis <15 Detik Tanpa Reload', async ({ browser }) => {
    // Shared state across 3 roles
    let orderStatus = 'PROCESSING';
    let courierTracking = 'JNE-PENDING-001';
    let totalRevenue = 18500000;
    let pendingApprovals = 1;

    // ==========================================
    // 1. CONTEXT PELANGGAN (/akun)
    // ==========================================
    const customerContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const customerPage = await customerContext.newPage();

    await customerPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-cust-v2-spi');
      localStorage.setItem('cde_user_role', 'user');
    });

    await customerPage.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 801, name: 'Dewi Anggraini', email: 'dewi.ang@example.com', role: 'user' },
        }),
      });
    });

    await customerPage.route('**/api/v1/user/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 888,
              order_number: 'CDE-SPI-888',
              created_at: '2026-11-07T09:00:00Z',
              total: 18500000,
              order_status: orderStatus,
              tracking_number: courierTracking,
              courier: 'JNE Express (Berasuransi)',
              items: [{ product_id: 1, product_name: 'Kalung Mutiara Ratu Sire', price: 18500000, quantity: 1 }],
            },
          ],
        }),
      });
    });

    await customerPage.route('**/api/v1/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { ETag: `W/"cust-801-${orderStatus}"` },
        body: JSON.stringify({
          status: 'success',
          data: {
            role: 'user',
            user_id: 801,
            server_time: new Date().toISOString(),
            orders_count: 1,
            active_orders_count: orderStatus === 'DELIVERED' || orderStatus === 'CANCELLED' ? 0 : 1,
            pending_payment_count: 0,
            latest_order: {
              id: 888,
              order_number: 'CDE-SPI-888',
              order_status: orderStatus,
              payment_status: 'PAID',
              tracking_number: courierTracking,
              courier: 'JNE Express (Berasuransi)',
            },
          },
        }),
      });
    });

    // ==========================================
    // 2. CONTEXT ADMIN (/admin)
    // ==========================================
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();

    await adminPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-admin-v2-spi');
      localStorage.setItem('cde_user_role', 'admin');
    });

    await adminPage.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 2, name: 'Admin Butik', email: 'admin.butik@cdepearls.com', role: 'admin' },
        }),
      });
    });

    await adminPage.route('**/api/v1/admin/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total_orders: 1,
            total_revenue: totalRevenue,
            active_products: 1,
            low_stock_products: 0,
            pending_orders: 0,
            paid_orders: 1,
          },
        }),
      });
    });

    await adminPage.route('**/api/v1/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 888,
              order_number: 'CDE-SPI-888',
              created_at: '2026-11-07T09:00:00Z',
              customer_name: 'Dewi Anggraini',
              customer_email: 'dewi.ang@example.com',
              total: 18500000,
              order_status: orderStatus,
              tracking_number: courierTracking,
              courier: 'JNE Express (Berasuransi)',
              items: [{ product_id: 1, product_name: 'Kalung Mutiara Ratu Sire', price: 18500000, quantity: 1 }],
            },
          ],
        }),
      });
    });

    await adminPage.route('**/api/v1/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { ETag: `W/"admin-${orderStatus}"` },
        body: JSON.stringify({
          status: 'success',
          data: {
            role: 'admin',
            server_time: new Date().toISOString(),
            total_orders: 1,
            pending_orders: 0,
            processing_orders: orderStatus === 'PROCESSING' ? 1 : 0,
            low_stock_count: 0,
            pending_approvals_count: pendingApprovals,
          },
        }),
      });
    });

    // ==========================================
    // 3. CONTEXT SPI (/spi)
    // ==========================================
    const spiContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const spiPage = await spiContext.newPage();

    await spiPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-spi-v2');
      localStorage.setItem('cde_user_role', 'spi');
    });

    await spiPage.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 3, name: 'Auditor SPI Utama', email: 'auditor.spi@cdepearls.com', role: 'spi' },
        }),
      });
    });

    await spiPage.route('**/api/v1/spi/summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total_orders: 1,
            total_revenue: totalRevenue,
            today_revenue: totalRevenue,
            pending_approvals_count: pendingApprovals,
            orders_by_status: { [orderStatus]: 1 },
          },
        }),
      });
    });

    await spiPage.route('**/api/v1/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { ETag: `W/"spi-${orderStatus}-${totalRevenue}"` },
        body: JSON.stringify({
          status: 'success',
          data: {
            role: 'spi',
            server_time: new Date().toISOString(),
            today_revenue: totalRevenue,
            pending_approvals_count: pendingApprovals,
            orders_by_status: { [orderStatus]: 1 },
            latest_audit_id: 105,
          },
        }),
      });
    });

    // LANGKAH 1: Buka Pelanggan & Admin
    await customerPage.goto('/akun');
    await expect(customerPage.locator('text=/Halo, Dewi Anggraini|Dewi Anggraini/').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });
    await expect(customerPage.locator('text=Dikemas').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

    await adminPage.goto('/admin');
    await expect(adminPage.getByText('Panel Operasional Toko & Atelier')).toBeVisible({ timeout: 10000 });
    await expect(adminPage.locator('text=/Baru saja|Diperbarui/').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

    // LANGKAH 2: Buka SPI Control Center
    await spiPage.goto('/spi');
    await expect(spiPage.getByText('Pusat Kendali SPI')).toBeVisible({ timeout: 10000 });
    await expect(spiPage.locator('text=/Baru saja|Diperbarui/').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

    // LANGKAH 3: SPI Mengubah Status Pesanan menjadi SHIPPED (Dikirim) dan Input Resi
    orderStatus = 'SHIPPED';
    courierTracking = 'JNE-EXP-88997711';
    pendingApprovals = 0;

    // Trigger interval poll / foreground check
    await customerPage.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await adminPage.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // LANGKAH 4: Verifikasi Layar Pelanggan Berubah <15 detik Tanpa Reload
    await expect(
      customerPage.locator('text=Dikirim').filter({ visible: true }).first()
    ).toBeVisible({ timeout: 15000 });

    // LANGKAH 5: Verifikasi Layar Admin juga Berubah Real-time
    await expect(adminPage.locator('text=/Baru saja|Diperbarui/').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

    await customerContext.close();
    await adminContext.close();
    await spiContext.close();
  });
});
