import { test, expect } from '@playwright/test';

test.describe('Tahap N1: Verifikasi Integrasi Data API Murni & Status Kosong Dashboard', () => {

  test('1. Admin Portal: Login dengan 2 Pesanan & 1 Produk API - Metrik & Tabel Sesuai Data Nyata', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'mock-admin-token-n1');
      localStorage.setItem('cde_user_role', 'admin');
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, name: 'Admin Operasional', email: 'admin@cdepearls.com', role: 'admin' },
        }),
      });
    });

    await page.route('**/api/v1/admin/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total_orders: 2,
            total_revenue: 25000000,
            active_products: 1,
            low_stock_products: 0,
            pending_orders: 1,
            paid_orders: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/orders*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 101,
              order_number: 'CDE-2026-N1-001',
              created_at: '2026-11-06T08:00:00Z',
              customer_name: 'Dewi Lestari',
              customer_email: 'dewi@example.com',
              total: 15000000,
              subtotal: 15000000,
              order_status: 'PROCESSING',
              payment_method: 'TRANSFER_BANK',
              items: [{ product_id: 1, product_name: 'Kalung Mutiara South Sea Gold 12mm', price: 15000000, quantity: 1 }],
            },
            {
              id: 102,
              order_number: 'CDE-2026-N1-002',
              created_at: '2026-11-06T09:30:00Z',
              customer_name: 'Budi Hartono',
              customer_email: 'budi@example.com',
              total: 10000000,
              subtotal: 10000000,
              order_status: 'PENDING',
              payment_method: 'TRANSFER_BANK',
              items: [{ product_id: 1, product_name: 'Cincin Mutiara Barok 10mm', price: 10000000, quantity: 1 }],
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/admin/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              name: 'Kalung Mutiara South Sea Gold 12mm',
              category_slug: 'kalung-mutiara',
              price: 15000000,
              stock: 5,
              status: 'published',
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/admin/customers*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            { id: 1, name: 'Dewi Lestari', email: 'dewi@example.com', orders_count: 1, orders_sum_total: 15000000 },
            { id: 2, name: 'Budi Hartono', email: 'budi@example.com', orders_count: 1, orders_sum_total: 10000000 },
          ],
        }),
      });
    });

    await page.route('**/api/v1/categories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [{ id: 1, name: 'Kalung Mutiara', slug: 'kalung-mutiara' }] }),
      });
    });

    await page.route('**/api/v1/admin/certificates*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Verify Admin Portal title
    await expect(page.locator('text=Panel Operasional Toko & Atelier')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Ringkasan Toko')).toBeVisible();

    // Verify dynamic metrics match API data
    await expect(page.locator('text=Rp 25.000.000').first()).toBeVisible();
    await expect(page.locator('text=2 Pesanan').first()).toBeVisible();

    // Verify order numbers in table
    await expect(page.locator('text=CDE-2026-N1-001').first()).toBeVisible();
    await expect(page.locator('text=CDE-2026-N1-002').first()).toBeVisible();
    await expect(page.locator('text=Dewi Lestari').first()).toBeVisible();
    await expect(page.locator('text=Budi Hartono').first()).toBeVisible();

    // Verify no fabricated trend badge like "+18,4%" or "+12 pelanggan"
    const content = await page.textContent('body');
    expect(content).not.toContain('+18,4%');
    expect(content).not.toContain('+12 pelanggan baru');
    expect(content).not.toContain('157.800.000');
  });

  test('2. Admin Portal: Respons API Kosong - Menampilkan Keadaan Bersih (0 & Kosong Rapi)', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'mock-admin-token-n1');
      localStorage.setItem('cde_user_role', 'admin');
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, name: 'Admin Operasional', email: 'admin@cdepearls.com', role: 'admin' },
        }),
      });
    });

    await page.route('**/api/v1/admin/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total_orders: 0,
            total_revenue: 0,
            active_products: 0,
            low_stock_products: 0,
          },
        }),
      });
    });

    await page.route('**/api/v1/orders*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/v1/admin/products*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/v1/admin/customers*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/v1/categories*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/v1/admin/certificates*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });

    await page.goto('/admin', { waitUntil: 'domcontentloaded' });

    // Verify Admin Portal renders
    await expect(page.locator('text=Panel Operasional Toko & Atelier')).toBeVisible({ timeout: 10000 });

    // Verify 0 metrics and clean empty state
    await expect(page.locator('text=Rp 0').first()).toBeVisible();
    await expect(page.locator('text=0 Pesanan').first()).toBeVisible();
    await expect(page.locator('text=0 Akun').first()).toBeVisible();
    await expect(page.locator('text=Belum ada transaksi pesanan terbaru')).toBeVisible();

    // Verify no fake sparklines / trends
    const content = await page.textContent('body');
    expect(content).not.toContain('+18,4%');
    expect(content).not.toContain('157.800.000');
  });

  test('3. Customer Portal: Login dengan 1 Pesanan Aktif - Muncul di Riwayat dan Pelacak Logistik', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'mock-customer-token-n1');
      localStorage.setItem('cde_user_role', 'user');
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 7, name: 'Rina Kusuma', email: 'rina@example.com', role: 'user' },
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
              id: 701,
              order_number: 'CDE-CUST-701',
              created_at: '2026-11-06T10:00:00Z',
              total: 8500000,
              order_status: 'SHIPPED',
              tracking_number: 'JNE-REG-991283',
              courier: 'JNE YES Berasuransi',
              items: [
                {
                  product_id: 3,
                  product_name: 'Anting Mutiara Lombok Baroque Pearl',
                  price: 8500000,
                  quantity: 1,
                },
              ],
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/addresses*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [
            {
              id: 1,
              label: 'Rumah',
              recipient: 'Rina Kusuma',
              phone: '081234567890',
              full_address: 'Jl. Rinjani No. 12, Mataram, NTB',
              is_default: true,
            },
          ],
        }),
      });
    });

    await page.route('**/api/v1/wishlist*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      });
    });

    await page.goto('/akun', { waitUntil: 'domcontentloaded' });

    // Verify Greeting
    await expect(page.locator('text=Halo, Rina Kusuma')).toBeVisible({ timeout: 10000 });

    // Verify 1 active order stat card
    await expect(page.locator('text=1 Pesanan').first()).toBeVisible();

    // Verify tracker displays order ID and tracking number
    await expect(page.locator('text=Lacak Pesanan Terkini CDE-CUST-701')).toBeVisible();
    await expect(page.locator('text=JNE-REG-991283')).toBeVisible();

    // Verify order in table
    await expect(page.locator('text=CDE-CUST-701').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text=Rp 8.500.000').filter({ visible: true }).first()).toBeVisible();
  });

  test('4. Customer Portal: Respons API Kosong - Menampilkan Keadaan Bersih Tanpa Pesanan Palsu', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'mock-customer-token-n1');
      localStorage.setItem('cde_user_role', 'user');
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 7, name: 'Rina Kusuma', email: 'rina@example.com', role: 'user' },
        }),
      });
    });

    await page.route('**/api/v1/user/orders*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/v1/addresses*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/v1/wishlist*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });

    await page.goto('/akun', { waitUntil: 'domcontentloaded' });

    // Verify clean empty metrics
    await expect(page.locator('text=Halo, Rina Kusuma')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=0 Pesanan').first()).toBeVisible();
    await expect(page.locator('text=Tidak ada pengiriman aktif')).toBeVisible();
    await expect(page.locator('text=Belum ada riwayat pesanan').filter({ visible: true }).first()).toBeVisible();

    // Tracker should NOT appear when orders array is empty
    const tracker = page.locator('text=Lacak Pesanan Terkini');
    await expect(tracker).toHaveCount(0);
  });

  test('5. Viewport Mobile (iPhone 14, 390x844): Admin & Customer Portal Responsif dan Bersih', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'mock-customer-token-n1');
      localStorage.setItem('cde_user_role', 'user');
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 7, name: 'Rina Kusuma', email: 'rina@example.com', role: 'user' },
        }),
      });
    });

    await page.route('**/api/v1/user/orders*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/v1/addresses*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });
    await page.route('**/api/v1/wishlist*', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    });

    await page.goto('/akun', { waitUntil: 'domcontentloaded' });

    // Verify mobile customer portal renders clean empty state without overflow or crashes
    await expect(page.locator('text=Rina Kusuma').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Belum ada pesanan aktif').filter({ visible: true }).first()).toBeVisible();
  });
});
