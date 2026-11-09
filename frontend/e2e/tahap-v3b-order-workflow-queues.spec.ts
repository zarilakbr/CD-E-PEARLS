import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Tahap V3b: Full Cross-Role Order Sync & CRUD Workflow on MySQL cde_test', () => {
  let adminToken = '';
  let spiToken = '';
  let userToken = '';
  const testImagePath = path.resolve(__dirname, '../public/images/favicon.png');
  const backendDir = path.resolve(__dirname, '../../backend');

  test.beforeAll(() => {
    // Bersihkan cache dan rate limit sebelum pengujian otomatis
    execSync('php artisan cache:clear', { cwd: backendDir, encoding: 'utf-8' });

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

  test.beforeEach(() => {
    // Reset rate limiter cache per pengujian agar tidak terkena 429 saat simulasi cepat
    execSync('php artisan cache:clear', { cwd: backendDir, encoding: 'utf-8' });
  });

  const routeToLocalBackend = async (page: any) => {
    await page.addInitScript(() => {
      (window as any).__CDE_API_URL__ = 'http://127.0.0.1:8000/api/v1';
    });
  };

  test('1. Skenario Alur Pesanan Lengkap: Pelanggan Beli -> Unggah Bukti -> Admin Tolak -> Unggah Ulang -> Admin Verifikasi -> SPI Kirim Resi -> Pelanggan Notifikasi', async ({ browser }) => {
    test.setTimeout(120000);

    // ==========================================
    // TAHAP 1: PELANGGAN CHECKOUT & UNGGAH BUKTI
    // ==========================================
    const custContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const custPage = await custContext.newPage();
    await routeToLocalBackend(custPage);
    await custPage.addInitScript((token) => {
      localStorage.setItem('cde_auth_token', token);
      localStorage.setItem('cde_user_role', 'user');
    }, userToken);

    await custPage.goto('/katalog');
    const inStockProductCard = custPage.locator('[data-slot="product-card"]:not(:has-text("Terjual")):visible').first();
    await expect(inStockProductCard).toBeVisible({ timeout: 15000 });

    const heartBtn = inStockProductCard.locator('button[title*="favorit"]:visible').first();
    await heartBtn.dispatchEvent('click');

    await inStockProductCard.click();

    const addCartBtn = custPage.locator('button:has-text("Tambah ke Keranjang Belanja"):visible').first();
    await expect(addCartBtn).toBeVisible({ timeout: 10000 });
    await addCartBtn.click();
    await custPage.waitForTimeout(1500);

    // Kunjungi keranjang belanja riil untuk memastikan item masuk
    await custPage.goto('/keranjang');
    const qtyPlusBtn = custPage.locator('button[aria-label="Tambah jumlah"]:visible').first();
    await expect(qtyPlusBtn).toBeVisible({ timeout: 15000 });

    // Lanjut ke Checkout
    await custPage.goto('/checkout');
    await expect(custPage.locator('h1:has-text("Penyelesaian Pesanan")')).toBeVisible({ timeout: 15000 });
    const addressArea = custPage.locator('textarea').first();
    await expect(addressArea).toBeVisible({ timeout: 10000 });
    await addressArea.fill('Villa Sire Indah Blok B12, Tanjung, Lombok Utara');
    await custPage.locator('button:has-text("Buat Pesanan"):visible').first().click({ force: true });

    // Verifikasi pesanan berhasil dibuat oleh backend riil
    await expect(custPage.locator(':visible:has-text("Pesanan Berhasil Dibuat")').first()).toBeVisible({ timeout: 20000 });
    const orderCreatedHeader = custPage.locator('h2:has-text("Nomor Pesanan:")');
    await expect(orderCreatedHeader).toBeVisible({ timeout: 10000 });
    const orderNumberText = await orderCreatedHeader.textContent();
    const createdOrderNumber = orderNumberText ? orderNumberText.replace('Nomor Pesanan:', '').trim() : '';
    expect(createdOrderNumber.length).toBeGreaterThan(0);

    // Buka detail pesanan di portal akun pelanggan dan unggah bukti transfer
    await custPage.goto('/akun/pesanan');
    const orderRow = custPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(orderRow).toBeVisible({ timeout: 15000 });
    await orderRow.click();

    const uploadProofBtn = custPage.locator('button:has-text("Unggah Bukti Bayar"):visible').first();
    await expect(uploadProofBtn).toBeVisible({ timeout: 10000 });
    await uploadProofBtn.click();

    await custPage.setInputFiles('input[type="file"]', testImagePath);
    await custPage.locator('button:has-text("Kirim Bukti Pembayaran"):visible').first().click();
    await expect(custPage.locator(':visible:has-text("berhasil diunggah")').first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // TAHAP 2: ADMIN TOLAK BUKTI BAYAR AWAL (Bukti Buram)
    // ==========================================
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();
    adminPage.on('pageerror', err => console.log('ADMIN PAGE ERROR:', err.message));
    adminPage.on('console', msg => {
      if (msg.type() === 'error') console.log('ADMIN CONSOLE ERROR:', msg.text());
    });
    await routeToLocalBackend(adminPage);
    await adminPage.addInitScript((token) => {
      localStorage.setItem('cde_auth_token', token);
      localStorage.setItem('cde_user_role', 'admin');
    }, adminToken);

    await adminPage.goto('/admin/pesanan');
    await expect(adminPage.locator('h1:has-text("Kelola Pesanan")')).toBeVisible({ timeout: 15000 });

    // Klik tab filter antrean "Verifikasi Pembayaran"
    const reviewTab = adminPage.locator('button:has-text("Verifikasi Pembayaran"):visible').first();
    await expect(reviewTab).toBeVisible({ timeout: 10000 });
    await reviewTab.click();

    // Pesanan yang baru diunggah buktinya harus muncul di antrean verifikasi
    const adminOrderRow = adminPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(adminOrderRow).toBeVisible({ timeout: 15000 });
    await adminOrderRow.click();

    // Admin tolak pembayaran dengan alasan valid
    const rejectBtn = adminPage.locator('button:has-text("Tolak Pembayaran"):visible').first();
    await expect(rejectBtn).toBeVisible({ timeout: 10000 });
    await rejectBtn.click();

    const reasonInput = adminPage.locator('textarea[placeholder*="Contoh: Bukti transfer buram"]').first();
    await expect(reasonInput).toBeVisible({ timeout: 5000 });
    await reasonInput.fill('Foto bukti buram dan nominal tidak terlihat jelas.');
    await adminPage.locator('button[type="submit"]:has-text("Tolak Pembayaran"):visible').first().click();
    await expect(adminPage.locator(':visible:has-text("ditolak dan alasan dikirim")').first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // TAHAP 3: PELANGGAN LIHAT PENOLAKAN & UNGGAH ULANG BUKTI
    // ==========================================
    await custPage.goto('/akun/pesanan');
    const rejectedRow = custPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(rejectedRow).toBeVisible({ timeout: 15000 });
    await rejectedRow.click();

    // Banner penolakan tampil dengan alasan admin
    await expect(custPage.locator(':visible:has-text("Bukti Pembayaran Sebelumnya Ditolak")').first()).toBeVisible({ timeout: 10000 });
    await expect(custPage.locator(':visible:has-text("Foto bukti buram")').first()).toBeVisible({ timeout: 10000 });

    // Pelanggan unggah ulang bukti yang benar
    const reuploadBtn = custPage.locator('button:has-text("Unggah Ulang Bukti Bayar"):visible').first();
    await expect(reuploadBtn).toBeVisible({ timeout: 10000 });
    await reuploadBtn.click();

    await custPage.setInputFiles('input[type="file"]', testImagePath);
    await custPage.locator('button:has-text("Kirim Bukti Pembayaran"):visible').first().click();
    await expect(custPage.locator(':visible:has-text("berhasil diunggah")').first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // TAHAP 4: ADMIN VERIFIKASI PEMBAYARAN LUNAS (PAID)
    // ==========================================
    await adminPage.goto('/admin/pesanan');
    await adminPage.locator('button:has-text("Verifikasi Pembayaran"):visible').first().click();
    const reAdminRow = adminPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(reAdminRow).toBeVisible({ timeout: 15000 });
    await reAdminRow.click();

    // Verifikasi panel bukti transfer dan tombol Verifikasi Lunas tersedia
    const verifyPaidBtn = adminPage.locator('button:has-text("Verifikasi Lunas (PAID)"):visible').first();
    await expect(verifyPaidBtn).toBeVisible({ timeout: 10000 });

    // Pastikan admin TIDAK memiliki input resi / kurir (kontrol logistik adalah otoritas SPI)
    await expect(adminPage.locator('input[placeholder*="nomor resi"]').first()).toHaveCount(0);

    // Admin verifikasi pelunasan
    await verifyPaidBtn.click();
    await expect(adminPage.locator(':visible:has-text("berhasil diverifikasi lunas")').first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // TAHAP 5: SPI MEMPROSES & MENGIRIM PESANAN
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

    // Buka modul pesanan SPI
    await spiPage.locator('button:has-text("Pesanan"):visible').first().click();

    // Pesanan yang sudah diverifikasi admin muncul di portal SPI
    const spiOrderRow = spiPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(spiOrderRow).toBeVisible({ timeout: 15000 });
    await spiOrderRow.locator('button:has-text("Rincian & Status")').click();

    // SPI ubah status ke SHIPPED dengan resi & kurir
    const statusSelect = spiPage.locator('select:has-text("PENDING_PAYMENT")').first();
    await expect(statusSelect).toBeVisible({ timeout: 10000 });
    await statusSelect.selectOption('SHIPPED');

    await spiPage.locator('input[placeholder*="JNE Express"]').fill('JNE Express Berasuransi');
    await spiPage.locator('input[placeholder*="JNE-"]').fill('JNE-REG-8829910');

    await spiPage.locator('button:has-text("Terapkan Status Baru"):visible').first().click();
    await expect(spiPage.locator(':visible:has-text("berhasil diperbarui")').first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // TAHAP 4: PELANGGAN MELIHAT STATUS TERKIRIM
    // ==========================================
    await custPage.goto('/akun/pesanan');
    const updatedOrderRow = custPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(updatedOrderRow).toBeVisible({ timeout: 15000 });
    await updatedOrderRow.click();

    // Verifikasi badge status 'Dikirim' dan nomor resi tampil di detail
    await expect(custPage.locator(':visible:has-text("JNE-REG-8829910")').first()).toBeVisible({ timeout: 10000 });

    // Tombol batal TIDAK boleh muncul karena pesanan sudah diproses/lunas
    await expect(custPage.locator('button:has-text("Batalkan Pesanan")')).toHaveCount(0);

    // Tutup contexts
    await custContext.close();
    await adminContext.close();
    await spiContext.close();
  });

  test('2. Skenario CRUD Voucher Admin di Tab Pengaturan', async ({ page }) => {
    test.setTimeout(60000);
    await routeToLocalBackend(page);
    await page.addInitScript((token) => {
      localStorage.setItem('cde_auth_token', token);
      localStorage.setItem('cde_user_role', 'admin');
    }, adminToken);

    await page.goto('/admin/pengaturan?tab=vouchers');
    await expect(page.locator('h1:has-text("Pengaturan Toko")')).toBeVisible({ timeout: 15000 });

    // Verifikasi header tab voucher
    await expect(page.locator('h3:has-text("Voucher & Promosi")')).toBeVisible({ timeout: 10000 });

    // Buka modal tambah voucher
    const addVoucherBtn = page.locator('button:has-text("Tambah Voucher"):visible').first();
    await expect(addVoucherBtn).toBeVisible({ timeout: 10000 });
    await addVoucherBtn.click();

    await expect(page.locator('h3:has-text("Tambah Voucher Baru")')).toBeVisible({ timeout: 5000 });

    const newCode = `VOUCH${Date.now().toString().slice(-4)}`;
    await page.locator('input[placeholder*="CDEKEMILAU"]').fill(newCode);
    await page.locator('input[placeholder*="Contoh: 50000"]').fill('50000');
    await page.locator('button:has-text("Buat Voucher"):visible').first().click();

    // Tunggu modal tertutup
    await expect(page.locator('h3:has-text("Tambah Voucher Baru")')).toHaveCount(0, { timeout: 10000 });

    // Verifikasi voucher baru muncul di tabel
    await expect(page.locator(`:visible:has-text("${newCode}")`).first()).toBeVisible({ timeout: 15000 });
  });
});
