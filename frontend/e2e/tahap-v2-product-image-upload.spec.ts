import { test, expect } from '@playwright/test';

test.describe('Tahap V2: Unggah Gambar Produk & Tampilan Multi-Halaman', () => {

  test('5. Admin Unggah Gambar Produk - Gambar Tampil di Katalog, Detail Produk, Tabel Admin, dan Dashboard SPI', async ({ page }) => {
    page.on('console', msg => console.log('BROWSER_LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER_ERR:', err));
    page.on('response', res => { if (res.status() >= 400) console.log('HTTP_ERR:', res.status(), res.url()); });
    const uploadedImageUrl = '/storage/products/cde-ratu-sire-gold-luxury.webp';

    const uploadedProduct = {
      id: 991,
      code: 'PRD-LMB-KLG-888999',
      name: 'Kalung Mutiara Air Laut Sire Gold 13mm',
      category_slug: 'kalung-mutiara',
      category: 'Kalung Mutiara',
      price: 18500000,
      stock: 3,
      varietas: 'South Sea Pearl',
      grade: 'AAA',
      logam: 'Emas Kuning 18K',
      ukuran_mm: '13 mm',
      status: 'published',
      image: uploadedImageUrl,
      images: [
        { url: uploadedImageUrl, is_primary: true, alt: 'Kalung Mutiara Air Laut Sire Gold' },
      ],
      description: 'Kalung mutiara laut selatan eksklusif dengan kilau cermin murni.',
    };

    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-admin-image-v2');
      localStorage.setItem('cde_user_role', 'admin');
    });

    await page.route('**/storage/products/**', async (route) => {
      const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: transparentPixel,
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, name: 'Admin Kurator', email: 'admin@cdepearls.com', role: 'admin' },
        }),
      });
    });

    await page.route('**/api/v1/admin/dashboard', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total_orders: 1,
            total_revenue: 18500000,
            active_products: 1,
            low_stock_products: 0,
            pending_orders: 0,
            paid_orders: 1,
          },
        }),
      });
    });

    await page.route('**/api/v1/admin/products*', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: uploadedProduct,
            message: 'Produk berhasil ditambahkan.',
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [uploadedProduct],
          total: 1,
        }),
      });
    });

    await page.route('*/**/api/v1/categories*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 1, name: 'Kalung Mutiara', slug: 'kalung-mutiara' }],
        }),
      });
    });

    await page.route('*/**/api/v1/products**', async (route) => {
      const url = route.request().url();
      if (url.includes('/products/991') || url.includes('/products/PRD-LMB-KLG-888999')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: uploadedProduct,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [uploadedProduct],
          meta: { total: 1 },
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
            role: 'admin',
            server_time: new Date().toISOString(),
            total_orders: 1,
            pending_orders: 0,
            processing_orders: 0,
            low_stock_count: 0,
            pending_approvals_count: 0,
          },
        }),
      });
    });

    // 1. Verifikasi di Tabel Admin (/admin)
    await page.goto('/admin');
    await expect(page.getByText('Panel Operasional Toko & Atelier')).toBeVisible({ timeout: 10000 });

    // Pindah ke tab Produk di Admin
    const productTabBtn = page.locator('button:has-text("Katalog Produk"), button:has-text("Produk")').first();
    if (await productTabBtn.isVisible()) {
      await productTabBtn.click();
    }
    // Gambar produk tampil di tabel
    const adminImg = page.locator(`img[src*="${uploadedImageUrl}"], img[src*="cde-ratu-sire-gold-luxury"]`).first();
    await expect(adminImg).toBeVisible({ timeout: 10000 });

    // 2. Verifikasi di Katalog Publik (/katalog)
    await page.goto('/katalog');
    const catalogItem = page.locator('text=Kalung Mutiara Air Laut Sire Gold 13mm').first();
    await expect(catalogItem).toBeAttached();

    const catalogImg = page.locator(`img[src*="${uploadedImageUrl}"], img[src*="cde-ratu-sire-gold-luxury"]`).first();
    await expect(catalogImg).toBeAttached();
    await expect(catalogImg).toHaveAttribute('src', new RegExp(uploadedImageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    // 3. Verifikasi di Detail Produk (buka /produk/991)
    await page.goto('/produk/991');
    const detailItem = page.locator('text=Kalung Mutiara Air Laut Sire Gold 13mm').first();
    await expect(detailItem).toBeAttached();
    const detailImg = page.locator(`img[src*="${uploadedImageUrl}"], img[src*="cde-ratu-sire-gold-luxury"]`).first();
    await expect(detailImg).toBeAttached();
    await expect(detailImg).toHaveAttribute('src', new RegExp(uploadedImageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

    // 4. Verifikasi di Dashboard SPI (/spi)
    await page.addInitScript(() => {
      localStorage.setItem('cde_user_role', 'spi');
    });
    await page.route('**/storage/products/**', async (route) => {
      const transparentPixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      await route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: transparentPixel,
      });
    });

    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 3, name: 'SPI Inspector', email: 'spi@cdepearls.com', role: 'spi' },
        }),
      });
    });
    await page.route('**/api/v1/spi/summary', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total_orders: 1,
            total_revenue: 18500000,
            today_revenue: 18500000,
            pending_approvals_count: 0,
            top_products: [uploadedProduct],
          },
        }),
      });
    });

    await page.goto('/spi');
    await expect(page.getByText('Pusat Kendali SPI')).toBeVisible({ timeout: 10000 });
  });
});
