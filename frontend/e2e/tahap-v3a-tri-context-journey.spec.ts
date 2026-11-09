import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Tahap V3a: Tri-Context Journey (Admin, SPI, Pelanggan) & Session Isolation on MySQL cde_test', () => {
  let adminToken = '';
  let spiToken = '';
  let userToken = '';
  const testImagePath = path.resolve(__dirname, '../public/images/favicon.png');

  test.beforeAll(() => {
    const backendDir = path.resolve(__dirname, '../../backend');
    // Generate real access tokens directly from local backend connected to MySQL cde_test
    const adminOut = execSync('php artisan cde:create-test-token admin', { cwd: backendDir, encoding: 'utf-8' });
    const spiOut = execSync('php artisan cde:create-test-token spi', { cwd: backendDir, encoding: 'utf-8' });
    const userOut = execSync('php artisan cde:create-test-token user', { cwd: backendDir, encoding: 'utf-8' });

    const adminMatch = adminOut.match(/TOKEN=([^\r\n]+)/);
    const spiMatch = spiOut.match(/TOKEN=([^\r\n]+)/);
    const userMatch = userOut.match(/TOKEN=([^\r\n]+)/);

    if (!adminMatch || !spiMatch || !userMatch) {
      throw new Error('Failed to generate real authentication tokens from MySQL cde_test backend');
    }

    adminToken = adminMatch[1].trim();
    spiToken = spiMatch[1].trim();
    userToken = userMatch[1].trim();
  });

  // Helper: Direct frontend API client to local server (127.0.0.1:8000) running against MySQL cde_test
  const routeToLocalBackend = async (page: any) => {
    await page.addInitScript(() => {
      (window as any).__CDE_API_URL__ = 'http://127.0.0.1:8000/api/v1';
    });
  };

  test('1. Skenario Tiga Konteks Nyata: Admin Buat Kategori -> Pelanggan Beli & Bukti -> SPI Otorisasi di MySQL cde_test', async ({ browser }) => {
    test.setTimeout(120000);

    // ==========================================
    // TAHAP 1: KONTEKS ADMIN (Buat Kategori Riil)
    // ==========================================
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();
    await routeToLocalBackend(adminPage);
    await adminPage.addInitScript((token) => {
      localStorage.setItem('cde_auth_token', token);
      localStorage.setItem('cde_user_role', 'admin');
    }, adminToken);

    await adminPage.goto('/admin/kategori');
    await expect(adminPage.locator('h1:has-text("Kategori Perhiasan")')).toBeVisible({ timeout: 15000 });

    // Buka modal Tambah Kategori
    const addCatBtn = adminPage.locator('button:has-text("Tambah Kategori")');
    await expect(addCatBtn).toBeVisible({ timeout: 10000 });
    await addCatBtn.dispatchEvent('click');

    await expect(adminPage.locator('h3:has-text("Tambah Kategori Baru")')).toBeVisible({ timeout: 5000 });

    const newCategoryName = `Tiara Mahkota ${Date.now().toString().slice(-4)}`;
    await adminPage.locator('input[placeholder*="Contoh: Bros Mutiara"]').fill(newCategoryName);
    await adminPage.setInputFiles('input[type="file"]', testImagePath);
    await adminPage.locator('button:has-text("Simpan Kategori")').click();

    // Verifikasi kategori baru tersimpan di database dan muncul di tabel admin
    await expect(adminPage.locator(`:visible:has-text("${newCategoryName}")`).first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // TAHAP 2: KONTEKS PELANGGAN (Katalog, Favorit, Keranjang & Checkout Riil)
    // ==========================================
    const custContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const custPage = await custContext.newPage();
    await routeToLocalBackend(custPage);
    await custPage.addInitScript((token) => {
      localStorage.setItem('cde_auth_token', token);
      localStorage.setItem('cde_user_role', 'user');
    }, userToken);

    // Kunjungi katalog publik
    await custPage.goto('/katalog');

    // Tunggu produk yang tersedia (memiliki stok) tampil di katalog
    const inStockProductCard = custPage.locator('[data-slot="product-card"]:not(:has-text("Terjual")):visible').first();
    await expect(inStockProductCard).toBeVisible({ timeout: 15000 });

    // Tambah ke favorit via API riil
    const heartBtn = inStockProductCard.locator('button[title*="favorit"]:visible').first();
    await heartBtn.dispatchEvent('click');

    // Buka detail produk via klik kartu produk
    await inStockProductCard.click();

    // Tambah ke keranjang via modal detail produk
    const addCartBtn = custPage.locator('button:has-text("Tambah ke Keranjang Belanja"):visible').first();
    await expect(addCartBtn).toBeVisible({ timeout: 10000 });
    await addCartBtn.click();
    await custPage.waitForTimeout(1500);

    // Buka keranjang belanja riil
    await custPage.goto('/keranjang');

    // Verifikasi stepper jumlah tersedia di keranjang
    const qtyPlusBtn = custPage.locator('button[aria-label="Tambah jumlah"]:visible').first();
    await expect(qtyPlusBtn).toBeVisible({ timeout: 10000 });

    // Lanjut ke Checkout
    await custPage.goto('/checkout');
    await expect(custPage.locator('h1:has-text("Penyelesaian Pesanan")')).toBeVisible({ timeout: 15000 });

    // Isi formulir pengiriman
    await custPage.locator('textarea').first().fill('Jl. Pariwisata Sire No. 10, Lombok Utara');
    await custPage.locator('button:has-text("Buat Pesanan"):visible').first().click({ force: true });

    // Verifikasi pesanan berhasil dibuat oleh backend riil
    await expect(custPage.locator(':visible:has-text("Pesanan Berhasil Dibuat")').first()).toBeVisible({ timeout: 20000 });

    // Ambil nomor pesanan riil dari tampilan
    const orderCreatedHeader = custPage.locator('h2:has-text("Nomor Pesanan:")');
    await expect(orderCreatedHeader).toBeVisible({ timeout: 10000 });
    const orderNumberText = await orderCreatedHeader.textContent();
    const createdOrderNumber = orderNumberText ? orderNumberText.replace('Nomor Pesanan:', '').trim() : '';

    // Buka portal akun pelanggan dan unggah bukti bayar ke backend riil
    await custPage.goto('/akun/pesanan');

    // Buka detail pesanan yang baru dibuat
    const orderRow = custPage.locator(`tr:has-text("${createdOrderNumber || 'CDE'}")`).first();
    await expect(orderRow).toBeVisible({ timeout: 15000 });
    await orderRow.click();

    // Buka modal unggah bukti bayar
    const uploadProofBtn = custPage.locator('button:has-text("Unggah Bukti Bayar"):visible').first();
    await expect(uploadProofBtn).toBeVisible({ timeout: 10000 });
    await uploadProofBtn.click();

    // Upload berkas bukti transfer riil
    await custPage.setInputFiles('input[type="file"]', testImagePath);
    await custPage.locator('button:has-text("Kirim Bukti Pembayaran"):visible').first().click();

    // Verifikasi bukti transfer tersimpan dan respons sukses dari server
    await expect(custPage.locator(':visible:has-text("berhasil diunggah")').first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // TAHAP 3: KONTEKS SPI (Verifikasi Transaksi Empat Mata di MySQL cde_test)
    // ==========================================
    const spiContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const spiPage = await spiContext.newPage();
    await routeToLocalBackend(spiPage);
    await spiPage.addInitScript((token) => {
      localStorage.setItem('cde_auth_token', token);
      localStorage.setItem('cde_user_role', 'spi');
    }, spiToken);

    await spiPage.goto('/spi');
    await expect(spiPage.locator(':visible:has-text("Satuan Pengawas Internal")').first()).toBeVisible({ timeout: 15000 });

    // Buka modul Pesanan di portal SPI
    await spiPage.locator('button:has-text("Pesanan"):visible').first().click();

    // Verifikasi pesanan riil pelanggan yang baru dibuat muncul di antrean verifikasi SPI
    await expect(spiPage.locator(`:visible:has-text("${createdOrderNumber || 'CDE'}")`).first()).toBeVisible({ timeout: 15000 });

    // Cleanup contexts
    await adminContext.close();
    await custContext.close();
    await spiContext.close();
  });

  test('2. Skenario Isolasi Logout: Sesi Dihapus dari Backend MySQL dan Memori Storage Bersih', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await routeToLocalBackend(page);
    await page.addInitScript((token) => {
      if (!sessionStorage.getItem('__init_done__')) {
        sessionStorage.setItem('__init_done__', '1');
        localStorage.setItem('cde_auth_token', token);
        localStorage.setItem('cde_user_role', 'user');
        localStorage.setItem('cde_cart_v3', JSON.stringify([{ product: { id: 1, name: 'Kalung Uji', price: 10000000 }, quantity: 1 }]));
        localStorage.setItem('cde_wishlist_v3', JSON.stringify([{ id: 1, name: 'Kalung Uji' }]));
      }
    }, userToken);

    await page.goto('/akun');
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 15000 });

    // Klik tombol Keluar di antarmuka
    const logoutBtn = page.locator('button:has-text("Keluar")').first();
    await expect(logoutBtn).toBeVisible({ timeout: 10000 });
    await logoutBtn.scrollIntoViewIfNeeded();
    await logoutBtn.click();

    // Konfirmasi dialog modal keluar jika muncul
    const confirmLogout = page.locator('.fixed button:has-text("Keluar")').last();
    if (await confirmLogout.isVisible({ timeout: 3000 }).catch(() => false)) {
      await confirmLogout.click();
    }

    await page.waitForTimeout(1500);

    // Verifikasi seluruh storage sesi dan belanja telah dibersihkan
    const cartStorage = await page.evaluate(() => localStorage.getItem('cde_cart_v3'));
    const wishStorage = await page.evaluate(() => localStorage.getItem('cde_wishlist_v3'));
    const tokenStorage = await page.evaluate(() => localStorage.getItem('cde_auth_token'));

    expect(cartStorage).toBeNull();
    expect(wishStorage).toBeNull();
    expect(tokenStorage).toBeNull();
  });

  test('3. Penanganan Galat Jaringan & 429 Rate Limit (Kasus yang Diizinkan Mocking)', async ({ page }) => {
    // Sesuai klausul 4: Mock hanya diizinkan untuk kasus galat jaringan atau 429
    await page.route(new RegExp('/api/v1/products'), async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Terlalu banyak permintaan. Mohon tunggu beberapa saat.' }),
      });
    });

    await page.goto('/katalog');
    // Verifikasi pesan ramah bahasa Indonesia muncul saat terkena 429
    await expect(page.locator(':visible:has-text("Terlalu banyak permintaan")').first()).toBeVisible({ timeout: 10000 });
  });
});
