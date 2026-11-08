import { test, expect } from '@playwright/test';

test.describe('Tahap V2d: Cross-Origin Media Resolution (Frontend vs API Storage)', () => {
  const API_ORIGIN = 'https://api.cdepearlslombok.id';
  const relativeImagePath = '/storage/products/cross-origin-pearl.png';
  const expectedAbsoluteImageUrl = `${API_ORIGIN}${relativeImagePath}`;

  const crossOriginProduct = {
    id: 992,
    code: 'PRD-LMB-KLG-992001',
    name: 'Kalung Mutiara Cross Origin 14mm',
    category_slug: 'kalung-mutiara',
    category: 'Kalung Mutiara',
    price: 22000000,
    formattedPrice: 'Rp 22.000.000',
    stock: 5,
    varietas: 'South Sea Pearl',
    grade: 'AAA',
    logam: 'Emas Kuning 18K',
    ukuran_mm: '14 mm',
    status: 'published',
    image: relativeImagePath, // API returns relative path
    webp_url: '/storage/products/cross-origin-pearl.webp',
    images: [
      { url: relativeImagePath, is_primary: true, alt: 'Kalung Mutiara Cross Origin' },
    ],
    description: 'Kalung mutiara laut selatan mewah dengan resolusi media lintas-origin.',
  };

  // Valid 10x10 PNG binary image
  const validPngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVR42mP8z8BQz0AEYBxVGDUAAAn/A/7q/w9cAAAAAElFTkSuQmCC',
    'base64'
  );

  test.beforeEach(async ({ page }) => {
    // 1. Storage routing: API origin returns 200 with valid PNG, Frontend origin returns 404
    await page.route(new RegExp('/storage/products/'), async (route) => {
      const url = route.request().url();
      if (url.startsWith(API_ORIGIN)) {
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: validPngBuffer,
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: 'text/plain',
          body: 'Not Found on frontend origin (No Vite storage proxy)',
        });
      }
    });

    // 2. Mock Authentication & API Data
    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'token-admin-v2d');
      localStorage.setItem('cde_user_role', 'admin');
    });

    await page.route(new RegExp('/api/v1/auth/me'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, name: 'Admin Kurator', email: 'admin@cdepearls.com', role: 'admin' },
        }),
      });
    });

    await page.route(new RegExp('/api/v1/admin/dashboard'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            total_orders: 1,
            total_revenue: 22000000,
            active_products: 1,
            low_stock_products: 0,
            pending_orders: 0,
            paid_orders: 1,
          },
        }),
      });
    });

    await page.route(new RegExp('/api/v1/admin/products'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [crossOriginProduct],
          total: 1,
        }),
      });
    });

    await page.route(new RegExp('/api/v1/categories'), async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [{ id: 1, name: 'Kalung Mutiara', slug: 'kalung-mutiara' }],
        }),
      });
    });

    await page.route(new RegExp('/api/v1/products'), async (route) => {
      const url = route.request().url();
      if (url.includes('/products/992') || url.includes('/products/PRD-LMB-KLG-992001')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: crossOriginProduct,
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [crossOriginProduct],
          total: 1,
        }),
      });
    });

    await page.route(new RegExp('/api/v1/sync/status'), async (route) => {
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
  });

  test('1. Gambar di Katalog Publik memuat dari API origin dan naturalWidth > 0 (bukan fallback)', async ({ page }) => {
    await page.goto('/katalog');
    const catalogItem = page.locator('text=Kalung Mutiara Cross Origin 14mm').first();
    await expect(catalogItem).toBeAttached({ timeout: 10000 });

    const catalogImg = page.locator('img[src*="cross-origin-pearl.png"]').filter({ visible: true }).first();
    await expect(catalogImg).toBeVisible({ timeout: 10000 });

    // Buktikan src mengarah ke API origin, bukan frontend origin
    const src = await catalogImg.getAttribute('src');
    expect(src).toBe(expectedAbsoluteImageUrl);

    await catalogImg.scrollIntoViewIfNeeded();

    // Buktikan gambar asli berhasil dimuat (naturalWidth > 0, bukan broken atau placeholder)
    await expect.poll(async () => {
      return await catalogImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    }, { timeout: 10000 }).toBeGreaterThan(0);
  });

  test('2. Gambar di Detail Produk memuat dari API origin dan naturalWidth > 0', async ({ page }) => {
    await page.goto('/produk/992');
    const detailItem = page.locator('text=Kalung Mutiara Cross Origin 14mm').first();
    await expect(detailItem).toBeAttached({ timeout: 10000 });

    const detailImg = page.locator('img[src*="cross-origin-pearl.png"]').filter({ visible: true }).first();
    await expect(detailImg).toBeVisible({ timeout: 10000 });

    const src = await detailImg.getAttribute('src');
    expect(src).toBe(expectedAbsoluteImageUrl);

    await detailImg.scrollIntoViewIfNeeded();

    await expect.poll(async () => {
      return await detailImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    }, { timeout: 10000 }).toBeGreaterThan(0);
  });

  test('3. Gambar di Tabel Produk Admin memuat dari API origin dan naturalWidth > 0', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText('Panel Operasional Toko & Atelier')).toBeVisible({ timeout: 10000 });

    // Buka tab produk
    const productTabBtn = page.locator('button:has-text("Katalog Produk"), button:has-text("Produk")').first();
    if (await productTabBtn.isVisible()) {
      await productTabBtn.click();
    }

    const adminImg = page.locator('img[src*="cross-origin-pearl.png"]').filter({ visible: true }).first();
    await expect(adminImg).toBeVisible({ timeout: 10000 });

    const src = await adminImg.getAttribute('src');
    expect(src).toBe(expectedAbsoluteImageUrl);

    await adminImg.scrollIntoViewIfNeeded();

    await expect.poll(async () => {
      return await adminImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    }, { timeout: 10000 }).toBeGreaterThan(0);
  });
});
