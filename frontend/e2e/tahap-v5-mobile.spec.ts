import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const screenshotDir = 'C:\\Users\\LENOVO\\.gemini\\antigravity\\brain\\cc51c93f-9886-47b8-b703-14752b07899c\\screenshots\\tahap-v5';

// Mock sample product
const mockProducts = [
  {
    id: 101,
    name: 'Cincin Mutiara Emas South Sea 18K',
    slug: 'cincin-mutiara-emas-south-sea-18k',
    price: 14500000,
    formattedPrice: 'Rp 14.500.000',
    category: 'Cincin Mutiara',
    variety: 'Gold South Sea Pearl',
    grade: 'AAA',
    pearlSize: '12.8 mm',
    metal: 'Emas Kuning 18K (750)',
    weight: '4.8 gram',
    certificateNo: 'GIA-LMB-9921',
    description: 'Mahakarya cincin mutiara laut selatan Lombok dengan kilau cermin (mirror luster) keemasan alami.',
    stock: 3,
  },
];

const mockOrders = [
  {
    id: 701,
    order_number: 'CDE-202611-0701',
    created_at: '2026-11-13T10:00:00Z',
    date: '13 Nov 2026',
    customerName: 'Siti Rahmawati',
    customerPhone: '+62 812-3456-7890',
    shippingAddress: 'Jl. Pariwisata No. 12',
    city: 'Mataram',
    subtotal: 14500000,
    insuranceCost: 72500,
    total: 14572500,
    order_status: 'PAYMENT_REVIEW',
    status: 'Menunggu Verifikasi',
    paymentStatus: 'PAYMENT_REVIEW',
    payment_status: 'PAYMENT_REVIEW',
    paymentMethod: 'Transfer Bank Mandiri',
    paymentProofUrl: '/api/v1/orders/701/payments/10/proof',
    paymentProofPath: 'private/payments/proof-701.png',
    payments: [{ id: 10, status: 'PENDING', created_at: '2026-11-13T10:05:00Z' }],
    items: [
      {
        product_id: 101,
        name: 'Cincin Mutiara Emas South Sea 18K',
        product_name: 'Cincin Mutiara Emas South Sea 18K',
        price: 14500000,
        quantity: 1,
        pearlSize: '12.8 mm',
        metal: 'Emas Kuning 18K',
      },
    ],
  },
  {
    id: 702,
    order_number: 'CDE-202611-0702',
    created_at: '2026-11-12T14:30:00Z',
    date: '12 Nov 2026',
    customerName: 'Budi Santoso',
    customerPhone: '+62 819-8765-4321',
    shippingAddress: 'Jl. Senggigi Raya KM 8',
    city: 'Lombok Barat',
    subtotal: 28000000,
    insuranceCost: 140000,
    total: 28140000,
    order_status: 'PAID',
    status: 'Lunas & Diproses',
    paymentStatus: 'PAID',
    payment_status: 'PAID',
    paymentMethod: 'Transfer Bank BCA',
    courier: 'JNE Express (Berasuransi)',
    tracking_number: 'JNE-LMB-882199',
    payments: [{ id: 11, status: 'PAID', created_at: '2026-11-12T15:00:00Z' }],
    items: [
      {
        product_id: 102,
        name: 'Kalung Untaian Mutiara Putih Gradasi',
        product_name: 'Kalung Untaian Mutiara Putih Gradasi',
        price: 28000000,
        quantity: 1,
        pearlSize: '10 - 13 mm',
        metal: 'Emas Putih 18K',
      },
    ],
  },
];

const mockAddresses = [
  {
    id: 1,
    label: 'Rumah Utama',
    recipient: 'Siti Rahmawati',
    phone: '+62 812-3456-7890',
    city: 'Kota Mataram, NTB',
    address: 'Jl. Caturwarga No. 18, Mataram Barat',
    postalCode: '83126',
    isPrimary: true,
  },
];

// Helper to check horizontal scroll
async function assertNoHorizontalScroll(page: any, viewName: string) {
  const scrollInfo = await page.evaluate(() => {
    const docEl = document.documentElement;
    const body = document.body;
    return {
      docScrollWidth: docEl.scrollWidth,
      docClientWidth: docEl.clientWidth,
      bodyScrollWidth: body.scrollWidth,
      bodyClientWidth: body.clientWidth,
      hasOverflow: docEl.scrollWidth > docEl.clientWidth || body.scrollWidth > body.clientWidth,
    };
  });

  console.log(`[SCROLL-CHECK] ${viewName}: ${JSON.stringify(scrollInfo)}`);
  expect(scrollInfo.hasOverflow).toBe(false);
}

test.describe('Tahap V5 — Verifikasi Tampilan Mobile & Sinkron Tema', () => {
  const viewports = [
    { name: '360px', width: 360, height: 780 },
    { name: '390px', width: 390, height: 844 },
  ];

  const themes = ['light', 'dark'] as const;

  for (const vp of viewports) {
    for (const theme of themes) {
      test(`Pelanggan: Mobile ${vp.name} (${theme}) - Ringkasan, Pesanan, Detail, Bukti, Alamat`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        await page.addInitScript(({ role, thm }) => {
          localStorage.setItem('cde_auth_token', 'token-cust-v5');
          localStorage.setItem('cde_user_role', role);
          localStorage.setItem('cde_theme', thm);
        }, { role: 'user', thm: theme });

        // Mock routes
        await page.route(new RegExp('/api/v1/auth/me'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: { id: 701, name: 'Siti Rahmawati', email: 'siti.rahma@example.com', role: 'user' },
            }),
          });
        });

        await page.route(new RegExp('/api/v1/user/orders'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: mockOrders }),
          });
        });

        await page.route(new RegExp('/api/v1/user/addresses'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: mockAddresses }),
          });
        });

        await page.route(new RegExp('/api/v1/user/notifications'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: [] }),
          });
        });

        await page.route(new RegExp('/api/v1/sync/status'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ synced: true, timestamp: Date.now() }),
          });
        });

        await page.route(new RegExp('/api/v1/orders/.*/proof'), async (route) => {
          // Provide 1x1 png image
          const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzE1L/tAAAAABJRU5ErkJggg==', 'base64');
          await route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: buf,
          });
        });

        // 1. Ringkasan Pelanggan (/akun)
        await page.goto('/akun');
        await page.evaluate((thm) => {
          if (thm === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.removeAttribute('data-theme');
          }
        }, theme);

        await page.waitForSelector('.pearl-bg', { timeout: 10000 });
        if (vp.width === 360) {
          await assertNoHorizontalScroll(page, `Customer Summary ${vp.name} ${theme}`);
        }
        await page.screenshot({
          path: path.join(screenshotDir, `customer-summary-${vp.name}-${theme}.png`),
          fullPage: false,
        });

        // 2. Daftar Pesanan (/akun/pesanan)
        await page.goto('/akun/pesanan');
        await page.evaluate((thm) => {
          if (thm === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.removeAttribute('data-theme');
          }
        }, theme);
        await page.waitForTimeout(500);
        if (vp.width === 360) {
          await assertNoHorizontalScroll(page, `Customer Orders ${vp.name} ${theme}`);
        }
        await page.screenshot({
          path: path.join(screenshotDir, `customer-orders-${vp.name}-${theme}.png`),
          fullPage: false,
        });

        // 3. Detail Pesanan (buka pesanan pertama)
        const orderRow = page.locator('button:has-text("Rincian"), button:has-text("Detail"), tr, [data-slot="order-card"]').first();
        if (await orderRow.isVisible()) {
          await orderRow.click();
          await page.waitForTimeout(500);
          if (vp.width === 360) {
            await assertNoHorizontalScroll(page, `Customer Order Detail ${vp.name} ${theme}`);
          }
          await page.screenshot({
            path: path.join(screenshotDir, `customer-order-detail-${vp.name}-${theme}.png`),
            fullPage: false,
          });

          // 4. Modal Unggah Bukti
          const uploadBtn = page.locator('button:has-text("Unggah Bukti"), button:has-text("Unggah Ulang Bukti")').first();
          if (await uploadBtn.isVisible()) {
            await uploadBtn.click();
            await page.waitForTimeout(500);
            if (vp.width === 360) {
              await assertNoHorizontalScroll(page, `Customer Proof Modal ${vp.name} ${theme}`);
            }
            await page.screenshot({
              path: path.join(screenshotDir, `customer-proof-modal-${vp.name}-${theme}.png`),
              fullPage: false,
            });
            // Close modal
            await page.keyboard.press('Escape');
          }
        }

        // 5. Daftar Alamat (/akun/alamat)
        await page.goto('/akun/alamat');
        await page.evaluate((thm) => {
          if (thm === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.removeAttribute('data-theme');
          }
        }, theme);
        await page.waitForTimeout(500);
        if (vp.width === 360) {
          await assertNoHorizontalScroll(page, `Customer Addresses ${vp.name} ${theme}`);
        }
        await page.screenshot({
          path: path.join(screenshotDir, `customer-addresses-${vp.name}-${theme}.png`),
          fullPage: false,
        });

        // 6. Modal Tambah Alamat
        const addAddrBtn = page.locator('button:has-text("Tambah Alamat")').first();
        if (await addAddrBtn.isVisible()) {
          await addAddrBtn.click();
          await page.waitForTimeout(500);
          if (vp.width === 360) {
            await assertNoHorizontalScroll(page, `Customer Add Address Modal ${vp.name} ${theme}`);
          }
          await page.screenshot({
            path: path.join(screenshotDir, `customer-add-address-modal-${vp.name}-${theme}.png`),
            fullPage: false,
          });
        }
      });

      test(`Admin & Modal: Mobile ${vp.name} (${theme})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        await page.addInitScript(({ role, thm }) => {
          localStorage.setItem('cde_auth_token', 'token-admin-v5');
          localStorage.setItem('cde_user_role', role);
          localStorage.setItem('cde_theme', thm);
        }, { role: 'admin', thm: theme });

        await page.route(new RegExp('/api/v1/auth/me'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: { id: 1, name: 'Admin CD\'E', email: 'admin@cdepearls.com', role: 'admin' },
            }),
          });
        });

        await page.route(new RegExp('/api/v1/admin/orders'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: mockOrders }),
          });
        });

        await page.route(new RegExp('/api/v1/admin/dashboard/stats'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              totalOrders: 154,
              totalRevenue: 245000000,
              pendingVerification: 1,
              lowStockCount: 2,
            }),
          });
        });

        await page.route(new RegExp('/api/v1/sync/status'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ synced: true, timestamp: Date.now() }),
          });
        });

        await page.route(new RegExp('/api/v1/orders/.*/proof'), async (route) => {
          const buf = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkWPjfDwAEeQHzE1L/tAAAAABJRU5ErkJggg==', 'base64');
          await route.fulfill({
            status: 200,
            contentType: 'image/png',
            body: buf,
          });
        });

        await page.goto('/admin');
        await page.evaluate((thm) => {
          if (thm === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.removeAttribute('data-theme');
          }
        }, theme);

        await page.waitForSelector('.pearl-bg', { timeout: 10000 });

        // Navigate to Orders queue tab in admin
        const ordersTabBtn = page.locator('button:has-text("Pesanan")').first();
        if (await ordersTabBtn.isVisible()) {
          await ordersTabBtn.click();
          await page.waitForTimeout(500);
        }

        if (vp.width === 360) {
          await assertNoHorizontalScroll(page, `Admin Orders Queue ${vp.name} ${theme}`);
        }
        await page.screenshot({
          path: path.join(screenshotDir, `admin-orders-queue-${vp.name}-${theme}.png`),
          fullPage: false,
        });

        // Buka detail pesanan di antrean verifikasi
        const reviewBtn = page.locator('button:has-text("Verifikasi"), button:has-text("Rincian"), tr:has-text("Menunggu Verifikasi")').first();
        if (await reviewBtn.isVisible()) {
          await reviewBtn.click();
          await page.waitForTimeout(500);

          if (vp.width === 360) {
            await assertNoHorizontalScroll(page, `Admin Verify Proof Modal ${vp.name} ${theme}`);
          }
          await page.screenshot({
            path: path.join(screenshotDir, `admin-verify-proof-modal-${vp.name}-${theme}.png`),
            fullPage: false,
          });
        }
      });

      test(`SPI: Antrean Pengiriman Mobile ${vp.name} (${theme})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        await page.addInitScript(({ role, thm }) => {
          localStorage.setItem('cde_auth_token', 'token-spi-v5');
          localStorage.setItem('cde_user_role', role);
          localStorage.setItem('cde_theme', thm);
        }, { role: 'spi', thm: theme });

        await page.route(new RegExp('/api/v1/auth/me'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              success: true,
              user: { id: 2, name: 'Auditor SPI CD\'E', email: 'spi@cdepearls.com', role: 'spi' },
            }),
          });
        });

        await page.route(new RegExp('/api/v1/spi/orders'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: mockOrders }),
          });
        });

        await page.route(new RegExp('/api/v1/sync/status'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ synced: true, timestamp: Date.now() }),
          });
        });

        await page.goto('/spi?menu=pesanan');
        await page.evaluate((thm) => {
          if (thm === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.removeAttribute('data-theme');
          }
        }, theme);

        await page.waitForSelector('.pearl-bg', { timeout: 10000 });
        await page.waitForTimeout(600);

        if (vp.width === 360) {
          await assertNoHorizontalScroll(page, `SPI Delivery Queue ${vp.name} ${theme}`);
        }
        await page.screenshot({
          path: path.join(screenshotDir, `spi-delivery-queue-${vp.name}-${theme}.png`),
          fullPage: false,
        });
      });

      test(`Katalog & Modal Detail Produk: Mobile ${vp.name} (${theme})`, async ({ page }) => {
        await page.setViewportSize({ width: vp.width, height: vp.height });

        await page.route(new RegExp('/api/v1/products'), async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ data: mockProducts }),
          });
        });

        await page.goto('/katalog');
        await page.evaluate((thm) => {
          if (thm === 'dark') {
            document.documentElement.classList.add('dark');
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.removeAttribute('data-theme');
          }
        }, theme);

        await page.waitForTimeout(600);

        // Klik salah satu kartu produk untuk memunculkan ProductDetailModal
        const card = page.locator('[data-slot="product-card"], .group:has-text("Cincin Mutiara")').first();
        if (await card.isVisible()) {
          await card.click();
          await page.waitForTimeout(600);

          if (vp.width === 360) {
            await assertNoHorizontalScroll(page, `Product Detail Modal ${vp.name} ${theme}`);
          }
          await page.screenshot({
            path: path.join(screenshotDir, `product-detail-modal-${vp.name}-${theme}.png`),
            fullPage: false,
          });
        }
      });
    }
  }
});

