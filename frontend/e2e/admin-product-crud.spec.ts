import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function loadAdminCredentials() {
  const envPath = path.resolve(process.cwd(), '../backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      val = val.replace(/\\(\$)/g, '$1');
      vars[key] = val;
    }
  }

  return {
    email: vars['SEED_ADMIN_EMAIL'] || 'admin@cdepearls.com',
    password: vars['SEED_ADMIN_PASSWORD'] || '',
  };
}

test.describe('TAHAP S-1: Admin Tambah & Nonaktifkan Produk (Form Nyata -> Katalog Publik)', () => {
  const adminCreds = loadAdminCredentials();
  const testProductName = `Kalung Mutiara Mahkota Samudra Tahap-S ${Date.now()}`;

  test('Alur Penuh: Admin login form -> Tambah produk -> Muncul di katalog -> Nonaktifkan -> Hilang dari katalog', async ({ page }) => {
    page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
    page.on('response', async (res) => {
      if (res.url().includes('products')) {
        console.log('PROD RES:', res.url(), res.status());
        if (res.status() === 422) {
          try {
            console.log('422 BODY:', JSON.stringify(await res.json()));
          } catch {}
        }
      }
    });

    // 1. Login Nyata lewat Form
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', adminCreds.email);
    await page.fill('input[name="password"]', adminCreds.password);
    await page.click('button[type="submit"]');

    // Mendarat di /admin
    await page.waitForURL('**/admin**', { timeout: 10000 });
    expect(page.url()).toContain('/admin');

    // 2. Buka Halaman /admin/produk
    await page.goto('/admin/produk');
    await page.waitForSelector('text=Katalog Produk', { timeout: 10000 });

    // 3. Verifikasi Tombol Tambah Produk (Satu Tombol)
    const addBtn = page.getByRole('button', { name: 'Tambah Produk' });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 4. Modal Form Terbuka
    await page.waitForSelector('text=Tambah Produk Baru', { timeout: 10000 });

    // 5. Isi Form Produk
    await page.fill('input[name="name"]', testProductName);
    await page.fill('input[name="ukuran_mm"]', '14.5');
    await page.fill('input[name="price"]', '35000000');
    await page.fill('input[name="stock"]', '7');
    await page.fill('textarea[name="description"]', 'Koleksi mahkota mutiara laut eksklusif atelier CD\'E Pearls Lombok.');

    // 6. Simpan Produk
    const saveBtn = page.getByRole('button', { name: 'Simpan Produk' });
    await saveBtn.click();

    // 7. Verifikasi Muncul di Tabel Admin
    await page.waitForSelector(`text=${testProductName}`, { timeout: 10000 });
    expect(await page.locator(`text=${testProductName}`).count()).toBeGreaterThan(0);

    // 8. Buka Katalog Publik (/katalog)
    await page.goto('/katalog');
    await page.waitForSelector('text=Koleksi Perhiasan Mutiara', { timeout: 10000 });

    // Verifikasi produk muncul di etalase publik
    const catalogItem = page.locator(`text=${testProductName}`).locator('visible=true').first();
    await expect(catalogItem).toBeVisible({ timeout: 10000 });

    // 9. Kembali ke /admin/produk untuk Menonaktifkan Produk
    await page.goto('/admin/produk');
    await page.waitForSelector(`text=${testProductName}`, { timeout: 10000 });

    // Temukan baris produk dan klik tombol nonaktifkan
    const row = page.locator('tr', { hasText: testProductName }).first();
    const deactivateBtn = row.locator('button[title="Nonaktifkan Produk"]').first();
    await deactivateBtn.click();

    // Verifikasi status produk berubah menjadi Nonaktif
    await expect(row.locator('text=Nonaktif').first()).toBeVisible({ timeout: 5000 });

    // 10. Buka kembali Katalog Publik (/katalog)
    await page.goto('/katalog');
    await page.waitForSelector('text=Koleksi Perhiasan Mutiara', { timeout: 10000 });

    // Pastikan produk sudah HILANG dari etalase publik
    const deactivatedInCatalog = page.locator(`text=${testProductName}`);
    expect(await deactivatedInCatalog.count()).toBe(0);
  });
});
