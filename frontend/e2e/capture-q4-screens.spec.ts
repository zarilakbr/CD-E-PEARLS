import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve(process.cwd(), '../docs/screens/tahap-q4');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

function loadCredentials() {
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
    user: { email: vars['SEED_USER_EMAIL'] || 'siti.rahma@gmail.com', pass: vars['SEED_USER_PASSWORD'] || '' },
    admin: { email: vars['SEED_ADMIN_EMAIL'] || 'admin@cdepearls.com', pass: vars['SEED_ADMIN_PASSWORD'] || '' },
    spi: { email: vars['SEED_SPI_EMAIL'] || 'owner.spi@cdepearls.com', pass: vars['SEED_SPI_PASSWORD'] || '' },
  };
}

const viewports = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
];

test.describe('TAHAP Q-4: Screenshot Capture Suite', () => {
  const creds = loadCredentials();

  for (const vp of viewports) {
    test(`Capture Screenshots ${vp.name}`, async ({ page }) => {
      await page.setViewportSize({ width: vp.width, height: vp.height });

      const capture = async (filename: string) => {
        await page.waitForTimeout(500);
        const p = path.join(outDir, `${filename}-${vp.name}.png`);
        await page.screenshot({ path: p, fullPage: false });
        const stat = fs.statSync(p);
        console.log(`[SCREENSHOT] ${filename}-${vp.name}.png | Size: ${stat.size} bytes | URL: ${page.url()}`);
      };

      // 1. Beranda
      await page.goto('/');
      await page.waitForSelector('img');
      await capture('01-beranda');

      // 2. Katalog
      await page.goto('/katalog');
      await page.waitForSelector('button');
      await capture('02-katalog');

      // 3. Detail
      await page.goto('/produk/1');
      await page.waitForTimeout(500);
      await capture('03-detail');

      // 4. Keranjang
      await page.goto('/keranjang');
      await page.waitForTimeout(500);
      await capture('04-keranjang');

      // 5. Akun (Guest Hub)
      await page.goto('/akun');
      await page.waitForTimeout(500);
      await capture('05-akun-guest');

      // 6. Masuk
      await page.goto('/masuk');
      await page.waitForSelector('input[name="email"]');
      await capture('06-masuk');

      // 7. Kontak Sheet / Modal
      await page.goto('/kontak');
      await page.waitForTimeout(500);
      await capture('07-kontak');

      // 8. Logged in /akun
      await page.goto('/masuk');
      await page.waitForSelector('input[name="email"]');
      await page.fill('input[name="email"]', creds.user.email);
      await page.fill('input[name="password"]', creds.user.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/akun**', { timeout: 10000 });
      await page.waitForTimeout(500);
      await capture('08-akun-user');

      // 9. Logged in /admin
      await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();
        try { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
        window.location.href = '/masuk';
      });
      await page.waitForURL('**/masuk**', { timeout: 10000 });
      await page.waitForSelector('input[name="email"]');
      await page.fill('input[name="email"]', creds.admin.email);
      await page.fill('input[name="password"]', creds.admin.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin**', { timeout: 10000 });
      await page.waitForTimeout(500);
      await capture('09-admin');

      // 10. Logged in /spi
      await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();
        try { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
        window.location.href = '/masuk';
      });
      await page.waitForURL('**/masuk**', { timeout: 10000 });
      await page.waitForSelector('input[name="email"]');
      await page.fill('input[name="email"]', creds.spi.email);
      await page.fill('input[name="password"]', creds.spi.pass);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/spi**', { timeout: 10000 });
      await page.waitForTimeout(500);
      await capture('10-spi');

      // Clean up session
      await page.evaluate(async () => {
        localStorage.clear();
        sessionStorage.clear();
        try { await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
        window.location.href = '/';
      });
    });
  }
});

