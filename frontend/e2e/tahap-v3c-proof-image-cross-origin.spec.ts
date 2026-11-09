import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test.describe('Tahap V3c: ProofImage Cross-Origin & IDOR Security on MySQL cde_test', () => {
  let adminToken = '';
  let userTokenA = '';
  let userTokenB = '';
  // Bukti A (favicon.png: 128x128) dan Bukti B (cde_monogram.png: 513x253) memiliki dimensi berbeda
  const proofAPath = path.resolve(__dirname, '../public/images/favicon.png');
  const proofBPath = path.resolve(__dirname, '../public/images/cde_monogram.png');
  const backendDir = path.resolve(__dirname, '../../backend');

  test.beforeAll(() => {
    // Bersihkan cache backend
    execSync('php artisan cache:clear', { cwd: backendDir, encoding: 'utf-8' });

    // 1. Dapatkan token Admin dan Pembeli A (User utama)
    const adminOut = execSync('php artisan cde:create-test-token admin', { cwd: backendDir, encoding: 'utf-8' });
    const userAOut = execSync('php artisan cde:create-test-token user', { cwd: backendDir, encoding: 'utf-8' });

    const adminMatch = adminOut.match(/TOKEN=([^\r\n]+)/);
    const userAMatch = userAOut.match(/TOKEN=([^\r\n]+)/);

    if (!adminMatch || !userAMatch) {
      throw new Error('Gagal menghasilkan token admin atau user A dari backend');
    }
    adminToken = adminMatch[1].trim();
    userTokenA = userAMatch[1].trim();

    // 2. Dapatkan token Pembeli B (User lain untuk uji IDOR)
    const phpUserB = "require 'vendor/autoload.php'; $app = require 'bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); $u = App\\Models\\User::firstOrCreate(['email' => 'pembeli_b_idor@cdpearls.com'], ['name' => 'Pembeli B Lain', 'password' => bcrypt('Password123!'), 'role' => 'user', 'status' => 'active', 'email_verified_at' => now()]); $u->forceFill(['must_change_password' => false, 'status' => 'active'])->save(); echo 'TOKEN=' . $u->createToken('test-b-idor')->plainTextToken;";
    const userBOut = execSync(`php -r "${phpUserB}"`, { cwd: backendDir, encoding: 'utf-8' });
    const userBMatch = userBOut.match(/TOKEN=([^\r\n]+)/);
    if (!userBMatch) {
      throw new Error('Gagal menghasilkan token user B dari backend');
    }
    userTokenB = userBMatch[1].trim();
  });

  test.beforeEach(() => {
    execSync('php artisan cache:clear', { cwd: backendDir, encoding: 'utf-8' });
  });

  const routeToLocalBackend = async (page: any) => {
    await page.addInitScript(() => {
      // API origin berbeda (http://127.0.0.1:8000) dari host frontend (http://localhost:5173)
      (window as any).__CDE_API_URL__ = 'http://127.0.0.1:8000/api/v1';
    });
  };

  test('Alur Penuh Bukti Transfer: Unggah Bukti A -> IDOR 404 -> Admin Tolak -> Unggah Ulang Bukti B -> Admin Lihat Bukti B (Bukan A) dengan naturalWidth > 0', async ({ browser, request }) => {
    test.setTimeout(120000);

    // ==========================================
    // LANGKAH 1: PEMBELI A CHECKOUT & UNGGAH BUKTI A
    // ==========================================
    const custContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const custPage = await custContext.newPage();
    await routeToLocalBackend(custPage);
    await custPage.addInitScript((token) => {
      localStorage.setItem('cde_auth_token', token);
      localStorage.setItem('cde_user_role', 'user');
    }, userTokenA);

    await custPage.goto('/katalog');
    const inStockProductCard = custPage.locator('[data-slot="product-card"]:not(:has-text("Terjual")):visible').first();
    await expect(inStockProductCard).toBeVisible({ timeout: 15000 });
    await inStockProductCard.click();

    const addCartBtn = custPage.locator('button:has-text("Tambah ke Keranjang Belanja"):visible').first();
    await expect(addCartBtn).toBeVisible({ timeout: 10000 });
    await addCartBtn.click();
    await custPage.waitForTimeout(1500);

    // Ke Checkout
    await custPage.goto('/checkout');
    await expect(custPage.locator('h1:has-text("Penyelesaian Pesanan")')).toBeVisible({ timeout: 15000 });
    const addressArea = custPage.locator('textarea').first();
    await expect(addressArea).toBeVisible({ timeout: 10000 });
    await addressArea.fill('Villa Mutiara Lombok Blok C-10, Sekotong');
    await custPage.locator('button:has-text("Buat Pesanan"):visible').first().click({ force: true });

    // Tangkap nomor pesanan
    await expect(custPage.locator(':visible:has-text("Pesanan Berhasil Dibuat")').first()).toBeVisible({ timeout: 20000 });
    const orderCreatedHeader = custPage.locator('h2:has-text("Nomor Pesanan:")');
    await expect(orderCreatedHeader).toBeVisible({ timeout: 10000 });
    const orderNumberText = await orderCreatedHeader.textContent();
    const createdOrderNumber = orderNumberText ? orderNumberText.replace('Nomor Pesanan:', '').trim() : '';
    expect(createdOrderNumber).toMatch(/^CDE-/);

    // Ke Riwayat Pesanan Pelanggan
    await custPage.goto('/akun/pesanan');
    const orderRow = custPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(orderRow).toBeVisible({ timeout: 15000 });
    await orderRow.click();

    // Buka Modal Unggah Bukti Bayar dan unggah Bukti A (favicon.png, 128x128)
    const uploadBtn = custPage.locator('button:has-text("Unggah Bukti Bayar"):visible').first();
    await expect(uploadBtn).toBeVisible({ timeout: 10000 });
    await uploadBtn.click();

    await expect(custPage.locator('h3:has-text("Unggah Bukti Pembayaran")')).toBeVisible({ timeout: 5000 });
    const fileInput = custPage.locator('input[type="file"]');
    await fileInput.setInputFiles(proofAPath);

    const notesArea = custPage.locator('textarea[placeholder*="Transfer via"]');
    await notesArea.fill('Bukti A transfer awal');

    await custPage.locator('button[type="submit"]:has-text("Kirim Bukti Pembayaran")').click();

    // Tunggu antarmuka memperbarui status ke PAYMENT_REVIEW dan menampilkan info bukti diterima
    await expect(custPage.locator(':visible:has-text("Bukti Transfer Telah Diterima")').first()).toBeVisible({ timeout: 20000 });

    // Verifikasi bahwa komponen ProofImage di CustomerPortal memuat Bukti A (naturalWidth === 128)
    const custProofImgA = custPage.locator('[data-testid="proof-image"]').first();
    await expect(custProofImgA).toBeVisible({ timeout: 15000 });
    const custWidthA = await custProofImgA.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(custWidthA).toBe(128);

    // Dapatkan data ID pesanan dan ID pembayaran dari backend untuk pengujian IDOR
    const orderDetailRes = await request.get(`http://127.0.0.1:8000/api/v1/user/orders`, {
      headers: { Authorization: `Bearer ${userTokenA}`, Accept: 'application/json' },
    });
    expect(orderDetailRes.status()).toBe(200);
    const jsonOrders = await orderDetailRes.json();
    const userOrders = Array.isArray(jsonOrders) ? jsonOrders : (jsonOrders.data || []);
    const targetOrder = userOrders.find((o: any) => o.order_number === createdOrderNumber);
    expect(targetOrder).toBeDefined();
    expect(targetOrder.payments).toBeDefined();
    expect(targetOrder.payments.length).toBeGreaterThan(0);
    const paymentIdA = targetOrder.payments[0].id;
    const orderId = targetOrder.id;

    // ==========================================
    // LANGKAH 2: UJI KEAMANAN IDOR (PEMBELI LAIN DITOLAK 404)
    // ==========================================
    const idorRes = await request.get(`http://127.0.0.1:8000/api/v1/orders/${orderId}/payments/${paymentIdA}/proof`, {
      headers: { Authorization: `Bearer ${userTokenB}`, Accept: 'application/json' },
    });
    expect(idorRes.status()).toBe(404);

    // ==========================================
    // LANGKAH 3: ADMIN MEMBUKA ANTREAN DAN MENOLAK BUKTI A
    // ==========================================
    const adminContext = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const adminPage = await adminContext.newPage();
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

    // Temukan baris pesanan di antrean Admin
    const adminOrderRow = adminPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(adminOrderRow).toBeVisible({ timeout: 15000 });
    await adminOrderRow.click();

    // Verifikasi panel antrean verifikasi dengan badge PAYMENT_REVIEW
    await expect(adminPage.locator(':visible:has-text("Antrean Verifikasi Bukti Pembayaran")').first()).toBeVisible({ timeout: 15000 });

    // Verifikasi Bukti A tampil dengan naturalWidth === 128
    const adminThumbImgA = adminPage.locator('[data-testid="proof-image"]').first();
    await expect(adminThumbImgA).toBeVisible({ timeout: 15000 });
    const thumbWidthA = await adminThumbImgA.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(thumbWidthA).toBe(128);

    // Admin menolak pembayaran
    const rejectBtn = adminPage.locator('button:has-text("Tolak Pembayaran"):visible').first();
    await expect(rejectBtn).toBeVisible({ timeout: 10000 });
    await rejectBtn.click();

    // Isi alasan penolakan di modal
    await expect(adminPage.locator('h3:has-text("Tolak Bukti Pembayaran")')).toBeVisible({ timeout: 5000 });
    const reasonArea = adminPage.locator('textarea[placeholder*="Contoh: Bukti transfer"]');
    await reasonArea.fill('Foto bukti terpotong dan nominal transfer tidak terlihat.');
    await adminPage.locator('button[type="submit"]:has-text("Tolak Pembayaran")').click();

    // Verifikasi toast sukses penolakan
    await expect(adminPage.locator(':visible:has-text("ditolak dan alasan dikirim ke pembeli")').first()).toBeVisible({ timeout: 15000 });

    // ==========================================
    // LANGKAH 4: PEMBELI A MENGUNGGAH ULANG BUKTI B (GAMBAR BERBEDA)
    // ==========================================
    await custPage.goto('/akun/pesanan');
    const custReRow = custPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(custReRow).toBeVisible({ timeout: 15000 });
    await custReRow.click();

    // Verifikasi peringatan bukti ditolak tampil
    await expect(custPage.locator(':visible:has-text("Bukti Pembayaran Sebelumnya Ditolak")').first()).toBeVisible({ timeout: 15000 });

    // Klik tombol Unggah Ulang Bukti Bayar
    const reUploadBtn = custPage.locator('button:has-text("Unggah Ulang Bukti Bayar"):visible').first();
    await expect(reUploadBtn).toBeVisible({ timeout: 10000 });
    await reUploadBtn.click();

    // Unggah Bukti B (cde_monogram.png: 513x253)
    await expect(custPage.locator('h3:has-text("Unggah Bukti Pembayaran")')).toBeVisible({ timeout: 5000 });
    const fileInputB = custPage.locator('input[type="file"]');
    await fileInputB.setInputFiles(proofBPath);

    const notesAreaB = custPage.locator('textarea[placeholder*="Transfer via"]');
    await notesAreaB.fill('Bukti B transfer ulang resolusi penuh');

    await custPage.locator('button[type="submit"]:has-text("Kirim Bukti Pembayaran")').click();

    // Tunggu status kembali ke PAYMENT_REVIEW
    await expect(custPage.locator(':visible:has-text("Bukti Transfer Telah Diterima")').first()).toBeVisible({ timeout: 20000 });

    // Verifikasi di CustomerPortal bahwa gambar yang tampil adalah Bukti B (naturalWidth === 513, BUKAN 128)
    const custProofImgB = custPage.locator('[data-testid="proof-image"]').first();
    await expect(custProofImgB).toBeVisible({ timeout: 15000 });
    const custWidthB = await custProofImgB.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(custWidthB).toBe(513);
    expect(custWidthB).not.toBe(128);

    // ==========================================
    // LANGKAH 5: ADMIN BUKA ANTREAN -> ASSERT BUKTI B (BUKAN BUKTI A LAMA)
    // ==========================================
    await adminPage.goto('/admin/pesanan');
    await adminPage.locator('button:has-text("Verifikasi Pembayaran"):visible').first().click();

    const reAdminOrderRow = adminPage.locator(`tr:has-text("${createdOrderNumber}")`).first();
    await expect(reAdminOrderRow).toBeVisible({ timeout: 15000 });
    await reAdminOrderRow.click();

    await expect(adminPage.locator(':visible:has-text("Antrean Verifikasi Bukti Pembayaran")').first()).toBeVisible({ timeout: 15000 });

    // CRITICAL: assert elemen gambar bukti di thumbnail Admin adalah BUKTI B (513x253), BUKAN BUKTI A (128x128)
    const adminThumbImgB = adminPage.locator('[data-testid="proof-image"]').first();
    await expect(adminThumbImgB).toBeVisible({ timeout: 15000 });
    const thumbWidthB = await adminThumbImgB.evaluate((img: HTMLImageElement) => img.naturalWidth);
    const thumbHeightB = await adminThumbImgB.evaluate((img: HTMLImageElement) => img.naturalHeight);

    expect(thumbWidthB).toBe(513);
    expect(thumbWidthB).not.toBe(128);
    expect(thumbHeightB).toBe(253);
    expect(thumbWidthB).toBeGreaterThan(0);

    // Admin klik "Perbesar Bukti Gambar"
    const enlargeBtn = adminPage.locator('button:has-text("Perbesar Bukti Gambar"):visible').first();
    await expect(enlargeBtn).toBeVisible({ timeout: 10000 });
    await enlargeBtn.click();

    // CRITICAL: assert gambar modal perbesar juga adalah BUKTI B (513x253), BUKAN BUKTI A
    await expect(adminPage.locator('h4:has-text("Pratinjau Bukti Transfer")')).toBeVisible({ timeout: 10000 });
    const modalImg = adminPage.locator('.fixed [data-testid="proof-image"]').last();
    await expect(modalImg).toBeVisible({ timeout: 15000 });

    const modalWidthB = await modalImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    const modalHeightB = await modalImg.evaluate((img: HTMLImageElement) => img.naturalHeight);

    expect(modalWidthB).toBe(513);
    expect(modalWidthB).not.toBe(128);
    expect(modalHeightB).toBe(253);
    expect(modalWidthB).toBeGreaterThan(0);

    // Tutup contexts
    await adminContext.close();
    await custContext.close();
  });
});
