import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function loadSpiCredentials() {
  const envPath = path.resolve(process.cwd(), '../backend/.env');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const vars: Record<string, string> = {};
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      val = val.replace(/\\(\$)/g, '$1');
      vars[trimmed.slice(0, eqIdx).trim()] = val;
    }
  }

  return {
    email: vars['SEED_SPI_EMAIL'] || 'owner.spi@cdepearls.com',
    password: vars['SEED_SPI_PASSWORD'] || '',
  };
}

test.describe('S-2 SPI: Pusat Kendali (/spi)', () => {
  const spiCreds = loadSpiCredentials();

  test('SPI real form login, view summary metrics, adjust stock, manage orders and settings', async ({ page }) => {
    // 1. Real form login without token injection
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', spiCreds.email);
    await page.fill('input[name="password"]', spiCreds.password);
    await page.click('button[type="submit"]');

    // Verify redirected to /spi
    await page.waitForURL('**/spi**', { timeout: 15000 });
    expect(page.url()).toContain('/spi');

    // 2. Ringkasan Menu
    await expect(page.locator('text=Ringkasan Pusat Kendali SPI').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Omzet Hari Ini').first()).toBeVisible();
    await expect(page.locator('text=Jumlah Pesanan Berdasarkan Status').first()).toBeVisible();
    await expect(page.locator('text=Peringatan Stok Menipis').first()).toBeVisible();

    // 3. Menu Pesanan
    await page.locator('aside nav button:has-text("Pesanan")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Pusat Kendali Pesanan Pelanggan').first()).toBeVisible();

    // If there is any order, click detail
    const detailBtn = page.locator('button:has-text("Rincian & Status")').first();
    if (await detailBtn.isVisible()) {
      await detailBtn.click();
      await expect(page.locator('text=Rincian Pesanan #').first()).toBeVisible();
      await expect(page.locator('text=Ubah Status Pesanan').first()).toBeVisible();
      // Close modal
      await page.locator('button:has-text("Tutup")').click();
    }

    // 4. Menu Produk & Stok
    await page.locator('aside nav button:has-text("Produk & Stok")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Pengawasan Fisik Produk & Koreksi Stok').first()).toBeVisible();

    // Adjust stock on first product
    const koreksiBtn = page.locator('button:has-text("Koreksi Stok")').first();
    await expect(koreksiBtn).toBeVisible({ timeout: 10000 });
    await koreksiBtn.click();

    await expect(page.locator('text=Koreksi Stok Fisik Mutiara').first()).toBeVisible();
    // Fill reason
    await page.locator('textarea').fill('Stock opname berkala butik SPI');
    // Click plus button
    await page.locator('button:has(svg.lucide-plus)').first().click();
    // Submit
    await page.locator('button:has-text("Simpan Koreksi Stok")').click();
    await page.waitForTimeout(1500);

    // 5. Menu Pengguna (RBAC & Self-Demote Prevention)
    await page.locator('aside nav button:has-text("Pengguna")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Pengawasan Akun Pengguna & Hak Akses').first()).toBeVisible();
    await expect(page.locator('text=Anda (SPI)').first()).toBeVisible();

    // 6. Menu Pengaturan Toko
    await page.locator('aside nav button:has-text("Pengaturan Toko")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Pengaturan Parameter Toko & Kebijakan Finansial').first()).toBeVisible();
    await expect(page.locator('input[value*="CD\'E"]').first()).toBeVisible();

    // 7. Menu Audit Log
    await page.locator('aside nav button:has-text("Audit Log")').click();
    await page.waitForTimeout(1000);
    await expect(page.locator('text=Log Audit Forensik & Jejak Rekam Sistem').first()).toBeVisible();
  });
});
