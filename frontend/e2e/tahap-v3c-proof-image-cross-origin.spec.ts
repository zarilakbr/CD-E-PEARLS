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
  const testImagePath = path.resolve(__dirname, '../public/images/favicon.png');
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

  test('Alur Lengkap Bukti Transfer: Unggah Bukti -> Tampil di Pembeli -> IDOR Ditolak 404 -> Admin Antrean naturalWidth > 0 -> Modal Perbesar naturalWidth > 0', async ({ browser, request }) => {
    test.setTimeout(120000);

    // ==========================================
    // LANGKAH 1: PEMBELI A CHECKOUT & UNGGAH BUKTI
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

    // Buka Modal Unggah Bukti Bayar
    const uploadBtn = custPage.locator('button:has-text("Unggah Bukti Bayar"):visible').first();
    await expect(uploadBtn).toBeVisible({ timeout: 10000 });
    await uploadBtn.click();

    await expect(custPage.locator('h3:has-text("Unggah Bukti Pembayaran")')).toBeVisible({ timeout: 5000 });
    const fileInput = custPage.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    const notesArea = custPage.locator('textarea[placeholder*="Transfer via"]');
    await notesArea.fill('Transfer BCA Rp 12.550.000 atas nama Pembeli A');

    await custPage.locator('button[type="submit"]:has-text("Kirim Bukti Pembayaran")').click();

    // Tunggu antarmuka memperbarui status ke PAYMENT_REVIEW dan menampilkan info bukti diterima
    await expect(custPage.locator(':visible:has-text("Bukti Transfer Telah Diterima")').first()).toBeVisible({ timeout: 20000 });

    // Verifikasi bahwa komponen ProofImage di CustomerPortal berhasil memuat gambar dengan naturalWidth > 0
    const custProofImg = custPage.locator('[data-testid="proof-image"]').first();
    await expect(custProofImg).toBeVisible({ timeout: 15000 });
    const custNaturalWidth = await custProofImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    const custNaturalHeight = await custProofImg.evaluate((img: HTMLImageElement) => img.naturalHeight);
    expect(custNaturalWidth).toBeGreaterThan(0);
    expect(custNaturalHeight).toBeGreaterThan(0);

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
    const paymentId = targetOrder.payments[0].id;
    const orderId = targetOrder.id;

    // ==========================================
    // LANGKAH 2: UJI KEAMANAN IDOR (PEMBELI LAIN DITOLAK 404)
    // ==========================================
    // Pembeli B (token user B) mencoba mengakses endpoint downloadProof milik Pembeli A
    const idorRes = await request.get(`http://127.0.0.1:8000/api/v1/orders/${orderId}/payments/${paymentId}/proof`, {
      headers: { Authorization: `Bearer ${userTokenB}`, Accept: 'application/json' },
    });
    expect(idorRes.status()).toBe(404);

    // Tamu tanpa token juga ditolak 401 atau 404
    const guestRes = await request.get(`http://127.0.0.1:8000/api/v1/orders/${orderId}/payments/${paymentId}/proof`, {
      headers: { Accept: 'application/json' },
    });
    expect([401, 404]).toContain(guestRes.status());

    // ==========================================
    // LANGKAH 3: ADMIN BUKA ANTREAN VERIFIKASI & ASSERT naturalWidth > 0
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

    // CRITICAL: assert elemen gambar bukti di thumbnail Admin punya naturalWidth > 0
    const adminThumbImg = adminPage.locator('[data-testid="proof-image"]').first();
    await expect(adminThumbImg).toBeVisible({ timeout: 15000 });
    const thumbWidth = await adminThumbImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    const thumbHeight = await adminThumbImg.evaluate((img: HTMLImageElement) => img.naturalHeight);
    expect(thumbWidth).toBeGreaterThan(0);
    expect(thumbHeight).toBeGreaterThan(0);

    // ==========================================
    // LANGKAH 4: ADMIN KLIK "Perbesar Bukti Gambar" -> MODAL naturalWidth > 0
    // ==========================================
    const enlargeBtn = adminPage.locator('button:has-text("Perbesar Bukti Gambar"):visible').first();
    await expect(enlargeBtn).toBeVisible({ timeout: 10000 });
    await enlargeBtn.click();

    // Modal pratinjau penuh terbuka
    await expect(adminPage.locator('h4:has-text("Pratinjau Bukti Transfer")')).toBeVisible({ timeout: 10000 });
    const modalImg = adminPage.locator('.fixed [data-testid="proof-image"]').last();
    await expect(modalImg).toBeVisible({ timeout: 15000 });

    // CRITICAL: assert elemen gambar bukti dalam modal punya naturalWidth > 0
    const modalWidth = await modalImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    const modalHeight = await modalImg.evaluate((img: HTMLImageElement) => img.naturalHeight);
    expect(modalWidth).toBeGreaterThan(0);
    expect(modalHeight).toBeGreaterThan(0);

    // Tutup contexts
    await adminContext.close();
    await custContext.close();
  });
});

