import { test, expect } from '@playwright/test';

test.describe('Tahap N2: Sinkronisasi Multi-Konteks Real-Time Antar Dashboard', () => {

  test('1. Multi-Konteks: Admin & Pelanggan Login Bersamaan - Status Berubah Tanpa Reload dalam 15 Detik', async ({ browser }) => {
    // Shared state between contexts
    let currentOrderStatus = 'PROCESSING';
    let currentTracking = '';
    let statusSyncCount = 0;

    // --- CONTEXT 1: PELANGGAN (CUSTOMER) ---
    const customerContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const customerPage = await customerContext.newPage();

    await customerPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-customer-sync-n2');
      localStorage.setItem('cde_user_role', 'user');
    });

    await customerPage.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 701, name: 'Siti Nurhaliza', email: 'siti@example.com', role: 'user' },
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
              id: 999,
              order_number: 'CDE-SYNC-999',
              created_at: '2026-11-06T10:00:00Z',
              total: 12500000,
              order_status: currentOrderStatus,
              tracking_number: currentTracking,
              courier: 'JNE Express',
              items: [
                {
                  product_id: 1,
                  product_name: 'Anting Mutiara Hitam Barok',
                  price: 12500000,
                  quantity: 1,
                },
              ],
            },
          ],
        }),
      });
    });

    await customerPage.route('**/api/v1/sync/status', async (route) => {
      statusSyncCount++;
      const etag = `W/"sync-user-701-${currentOrderStatus}-${statusSyncCount}"`;
      if (route.request().headers()['if-none-match'] === etag) {
        await route.fulfill({ status: 304 });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        headers: { ETag: etag },
        body: JSON.stringify({
          status: 'success',
          data: {
            role: 'user',
            user_id: 701,
            server_time: new Date().toISOString(),
            orders_count: 1,
            active_orders_count: currentOrderStatus === 'DELIVERED' || currentOrderStatus === 'CANCELLED' ? 0 : 1,
            pending_payment_count: 0,
            latest_order: {
              id: 999,
              order_number: 'CDE-SYNC-999',
              order_status: currentOrderStatus,
              payment_status: 'PAID',
              tracking_number: currentTracking,
              courier: 'JNE Express',
            },
          },
        }),
      });
    });

    // --- CONTEXT 2: ADMIN PORTAL ---
    const adminContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
    });
    const adminPage = await adminContext.newPage();

    await adminPage.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-admin-sync-n2');
      localStorage.setItem('cde_user_role', 'admin');
    });

    await adminPage.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, name: 'Admin Operasional', email: 'admin@cdepearls.com', role: 'admin' },
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
            total_revenue: 12500000,
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
              id: 999,
              order_number: 'CDE-SYNC-999',
              customer_name: 'Siti Nurhaliza',
              customer_email: 'siti@example.com',
              total: 12500000,
              order_status: currentOrderStatus,
              tracking_number: currentTracking,
              courier: 'JNE Express',
              items: [{ product_id: 1, product_name: 'Anting Mutiara Hitam Barok', price: 12500000, quantity: 1 }],
            },
          ],
        }),
      });
    });

    await adminPage.route('**/api/v1/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            role: 'admin',
            server_time: new Date().toISOString(),
            total_orders: 1,
            pending_orders: 0,
            processing_orders: currentOrderStatus === 'PROCESSING' ? 1 : 0,
            low_stock_count: 0,
            pending_approvals_count: 0,
          },
        }),
      });
    });

    // 1. Pelanggan membuka /akun
    await customerPage.goto('/akun');
    await expect(customerPage.locator('text=/Halo, Siti Nurhaliza|Siti Nurhaliza/').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });
    
    // Status awal pesanan di sisi Pelanggan adalah "Dikemas"
    await expect(customerPage.locator('text=Dikemas').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });
    // Label sync aktif
    await expect(customerPage.locator('text=/Baru saja|Diperbarui/').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

    // 2. Admin membuka /admin
    await adminPage.goto('/admin');
    await expect(adminPage.getByText('Panel Operasional Toko & Atelier')).toBeVisible({ timeout: 10000 });
    await expect(adminPage.locator('text=/Baru saja|Diperbarui/').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

    // 3. Simulasi Perubahan Status oleh Admin / SPI: dari PROCESSING -> SHIPPED
    currentOrderStatus = 'SHIPPED';
    currentTracking = 'JNE-CDE-88991122';

    // 4. Di Pelanggan, tanpa reload, trigger sync check
    await customerPage.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // 5. Buktikan layar Pelanggan berubah dalam <15 detik tanpa muat ulang
    await expect(
      customerPage.locator('text=Dikirim').filter({ visible: true }).first()
    ).toBeVisible({ timeout: 15000 });

    await customerContext.close();
    await adminContext.close();
  });

  test('2. Mobile Viewport (iPhone 14, 390x844): Sinkronisasi Real-Time & Penanda Status', async ({ browser }) => {
    let currentOrderStatus = 'PROCESSING';

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });
    const page = await mobileContext.newPage();

    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-mobile-sync-n2');
      localStorage.setItem('cde_user_role', 'user');
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 702, name: 'Aisyah Putri', email: 'aisyah@example.com', role: 'user' },
        }),
      });
    });

    await page.route('**/api/v1/user/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 998,
              order_number: 'CDE-SYNC-998',
              created_at: '2026-11-06T11:00:00Z',
              total: 8500000,
              order_status: currentOrderStatus,
              items: [{ product_id: 2, product_name: 'Gelang Mutiara Air Tawar', price: 8500000, quantity: 1 }],
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/sync/status', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          status: 'success',
          data: {
            role: 'user',
            user_id: 702,
            server_time: new Date().toISOString(),
            orders_count: 1,
            active_orders_count: 1,
            pending_payment_count: 0,
            latest_order: {
              id: 998,
              order_number: 'CDE-SYNC-998',
              order_status: currentOrderStatus,
              payment_status: 'PAID',
            },
          },
        }),
      });
    });

    await page.goto('/akun');
    await expect(page.locator('text=/Aisyah Putri/').filter({ visible: true }).first()).toBeVisible({ timeout: 10000 });

    // Di mobile, badge sync "Baru saja" / "Diperbarui" muncul rapi di bawah info member
    await expect(page.locator('text=/Baru saja|Diperbarui/').filter({ visible: true }).first()).toBeVisible({ timeout: 5000 });

    // Simulasi transisi status ke DELIVERED (Selesai)
    currentOrderStatus = 'DELIVERED';

    await page.evaluate(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await expect(
      page.locator('text=Selesai').filter({ visible: true }).first()
    ).toBeVisible({ timeout: 15000 });

    await mobileContext.close();
  });
});
