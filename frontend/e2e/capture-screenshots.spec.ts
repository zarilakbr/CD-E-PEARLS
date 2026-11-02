import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function loadCredentials() {
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
    admin: {
      email: vars['SEED_ADMIN_EMAIL'] || 'admin@cdepearls.com',
      password: vars['SEED_ADMIN_PASSWORD'] || '',
    },
    spi: {
      email: vars['SEED_SPI_EMAIL'] || 'owner.spi@cdepearls.com',
      password: vars['SEED_SPI_PASSWORD'] || '',
    },
  };
}

test.describe('Capture S-4 Screenshots', () => {
  const creds = loadCredentials();
  const screenshotDir = path.resolve(process.cwd(), 'e2e/screenshots');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  test('Capture Product Form Modal (1280px & 360px)', async ({ page }) => {
    // Desktop 1280x800
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', creds.admin.email);
    await page.fill('input[name="password"]', creds.admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/admin**', { timeout: 15000 });

    await page.goto('/admin/produk');
    await page.waitForSelector('button:has-text("Tambah Produk")', { timeout: 10000 });
    await page.locator('button:has-text("Tambah Produk")').first().click();
    await page.waitForSelector('text=Tambah Produk Baru', { timeout: 10000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'product-form-modal-1280px.png'), fullPage: false });

    // Mobile 360x740
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'product-form-modal-360px.png'), fullPage: false });
  });

  test('Capture SPI Control Center 5 Menus (1280px & 360px)', async ({ page }) => {
    // Login SPI
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', creds.spi.email);
    await page.fill('input[name="password"]', creds.spi.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/spi**', { timeout: 15000 });

    // 1. Ringkasan
    await page.waitForSelector('text=Ringkasan Pusat Kendali SPI', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-ringkasan-1280px.png') });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-ringkasan-360px.png') });

    // Modal Ekspor Excel
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('button:has-text("Ekspor Excel")').first().click();
    await page.waitForSelector('text=Ekspor Laporan Penjualan Excel (.xlsx)', { timeout: 5000 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-modal-ekspor-excel-1280px.png') });
    await page.locator('button:has-text("Batal")').click();

    // 2. Pesanan
    await page.locator('aside nav button:has-text("Pesanan")').click();
    await page.waitForSelector('text=Pusat Kendali Pesanan Pelanggan', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-pesanan-1280px.png') });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-pesanan-360px.png') });

    // 3. Produk & Stok
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('aside nav button:has-text("Produk & Stok")').click();
    await page.waitForSelector('text=Pengawasan Fisik Produk & Koreksi Stok', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-produk-stok-1280px.png') });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-produk-stok-360px.png') });

    // 4. Pengguna
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('aside nav button:has-text("Pengguna")').click();
    await page.waitForSelector('text=Pengawasan Akun Pengguna & Hak Akses', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-pengguna-1280px.png') });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-pengguna-360px.png') });

    // 5. Pengaturan Toko
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('aside nav button:has-text("Pengaturan Toko")').click();
    await page.waitForSelector('text=Pengaturan Parameter Toko & Kebijakan Finansial', { timeout: 10000 });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-pengaturan-toko-1280px.png') });
    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-pengaturan-toko-360px.png') });

    // 6. Sub-tab Audit Log Forensik di Ringkasan (U-10)
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.locator('aside nav button:has-text("Ringkasan")').click();
    await page.waitForTimeout(600);
    await page.locator('button:has-text("Log Audit Forensik")').click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(screenshotDir, 'spi-audit-log-subtab-1280px.png') });

    // Copy to artifact directory
    const artifactDir = 'C:/Users/LENOVO/.gemini/antigravity/brain/cc51c93f-9886-47b8-b703-14752b07899c/screenshots';
    if (!fs.existsSync(artifactDir)) {
      fs.mkdirSync(artifactDir, { recursive: true });
    }
    const files = fs.readdirSync(screenshotDir);
    for (const file of files) {
      if (file.endsWith('.png')) {
        fs.copyFileSync(path.join(screenshotDir, file), path.join(artifactDir, file));
      }
    }
  });

  test('Capture Order Tracking Page Guest Inputs (1280px & 360px)', async ({ page }) => {
    const artifactDir = 'C:/Users/LENOVO/.gemini/antigravity/brain/cc51c93f-9886-47b8-b703-14752b07899c/screenshots';
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/lacak-pesanan');
    await page.waitForSelector('text=Lacak Pesanan Mutiara', { timeout: 10000 });
    await page.screenshot({ path: path.join(screenshotDir, 'order-tracking-guest-1280px.png') });
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(path.join(screenshotDir, 'order-tracking-guest-1280px.png'), path.join(artifactDir, 'order-tracking-guest-1280px.png'));
    }

    await page.setViewportSize({ width: 360, height: 740 });
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(screenshotDir, 'order-tracking-guest-360px.png') });
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(path.join(screenshotDir, 'order-tracking-guest-360px.png'), path.join(artifactDir, 'order-tracking-guest-360px.png'));
    }
  });
});
