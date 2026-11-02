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

test.describe('S-3: Ekspor Excel Laporan Penjualan (Browser Download Nyata)', () => {
  const spiCreds = loadSpiCredentials();

  test('SPI membuka modal ekspor excel, memfilter laporan, dan mengunduh file .xlsx secara streaming', async ({ page }) => {
    // 1. Real form login
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', spiCreds.email);
    await page.fill('input[name="password"]', spiCreds.password);
    await page.click('button[type="submit"]');

    // Mendarat di /spi
    await page.waitForURL('**/spi**', { timeout: 15000 });
    expect(page.url()).toContain('/spi');

    // 2. Klik tombol "Ekspor Excel" di halaman Ringkasan
    const exportBtn = page.locator('button:has-text("Ekspor Excel")').first();
    await expect(exportBtn).toBeVisible({ timeout: 10000 });
    await exportBtn.click();

    // 3. Modal Ekspor Excel terbuka
    await expect(page.locator('text=Ekspor Laporan Penjualan Excel (.xlsx)').first()).toBeVisible();

    // 4. Set filter opsional (semua status, semua kategori)
    await page.locator('select').first().selectOption('all');

    // 5. Tangkap event download nyata dari browser
    const downloadPromise = page.waitForEvent('download', { timeout: 20000 });
    await page.locator('button:has-text("Unduh File Excel (.xlsx)")').click();
    const download = await downloadPromise;

    // 6. Verifikasi nama file dan ukuran file fisik
    const filename = download.suggestedFilename();
    expect(filename).toContain('.xlsx');
    expect(filename).toContain('Laporan_Penjualan_CDE_Pearls');

    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    if (downloadPath) {
      const stats = fs.statSync(downloadPath);
      expect(stats.size).toBeGreaterThan(2000);
      console.log(`[DOWNLOAD SUCCESS] File: ${filename}, Size: ${stats.size} bytes`);
    }

    // 7. Verifikasi Toast Sukses
    await expect(page.locator('text=File Excel laporan penjualan berhasil diunduh.').first()).toBeVisible();
  });
});
