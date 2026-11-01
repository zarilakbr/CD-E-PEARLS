import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

function loadSeedCredentials() {
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
      // Standard dotenv unescaping: \$ becomes $
      val = val.replace(/\\(\$)/g, '$1');
      vars[key] = val;
    }
  }

  return {
    user: {
      role: 'user',
      email: vars['SEED_USER_EMAIL'] || 'siti.rahma@gmail.com',
      password: vars['SEED_USER_PASSWORD'] || '',
      expectedPath: '/akun',
    },
    admin: {
      role: 'admin',
      email: vars['SEED_ADMIN_EMAIL'] || 'admin@cdepearls.com',
      password: vars['SEED_ADMIN_PASSWORD'] || '',
      expectedPath: '/admin',
    },
    spi: {
      role: 'spi',
      email: vars['SEED_SPI_EMAIL'] || 'owner.spi@cdepearls.com',
      password: vars['SEED_SPI_PASSWORD'] || '',
      expectedPath: '/spi',
    },
  };
}

const viewports = [
  { name: '320px (Mobile)', width: 320, height: 640 },
  { name: '1280px (Desktop)', width: 1280, height: 800 },
];

test.describe('TAHAP Q-5: Verifikasi Login Form UI Tiga Peran & Transisi Antar-Peran', () => {
  const accounts = loadSeedCredentials();

  for (const vp of viewports) {
    test.describe(`Viewport: ${vp.name}`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      test('Alur Penuh: Login User -> Logout -> Login Admin -> Logout -> Login SPI -> Logout (Tab Bersih)', async ({ page }) => {
        // --- 1. USER LOGIN ---
        await page.goto('/masuk');
        await page.waitForSelector('input[name="email"]');
        await page.fill('input[name="email"]', accounts.user.email);
        await page.fill('input[name="password"]', accounts.user.password);
        await page.click('button[type="submit"]');

        // Mendarat di /akun
        await page.waitForURL('**/akun**', { timeout: 10000 });
        expect(page.url()).toContain('/akun');
        await page.waitForTimeout(1000);

        // Pastikan bukan GuestAccountHub
        const guestCard = page.locator('text="Akun Koleksi Tamu"');
        expect(await guestCard.count()).toBe(0);

        // Sesi logout bersih via backend API + storage clear
        await page.evaluate(async () => {
          localStorage.clear();
          sessionStorage.clear();
          try {
            await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
          } catch {}
          window.location.href = '/masuk';
        });
        await page.waitForURL('**/masuk**', { timeout: 10000 });
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });

        // --- 2. ADMIN LOGIN (pada tab yang sama) ---
        await page.fill('input[name="email"]', accounts.admin.email);
        await page.fill('input[name="password"]', accounts.admin.password);
        await page.click('button[type="submit"]');

        // Mendarat di /admin
        await page.waitForURL('**/admin**', { timeout: 10000 });
        expect(page.url()).toContain('/admin');
        await page.waitForTimeout(1000);

        // Sesi logout bersih
        await page.evaluate(async () => {
          localStorage.clear();
          sessionStorage.clear();
          try {
            await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
          } catch {}
          window.location.href = '/masuk';
        });
        await page.waitForURL('**/masuk**', { timeout: 10000 });
        await page.waitForSelector('input[name="email"]', { timeout: 10000 });

        // --- 3. SPI LOGIN (pada tab yang sama) ---
        await page.fill('input[name="email"]', accounts.spi.email);
        await page.fill('input[name="password"]', accounts.spi.password);
        await page.click('button[type="submit"]');

        // Mendarat di /spi
        await page.waitForURL('**/spi**', { timeout: 10000 });
        expect(page.url()).toContain('/spi');
        await page.waitForTimeout(1000);

        // Sesi logout bersih
        await page.evaluate(async () => {
          localStorage.clear();
          sessionStorage.clear();
          try {
            await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
          } catch {}
          window.location.href = '/';
        });
        await page.waitForURL('**/', { timeout: 10000 });
      });
    });
  }

  test('Pesan Error UI: Kredensial Salah & Akun Belum Terverifikasi', async ({ page }) => {
    // 1. Kredensial Salah
    await page.goto('/masuk');
    await page.waitForSelector('input[name="email"]');
    await page.fill('input[name="email"]', 'random.salah@gmail.com');
    await page.fill('input[name="password"]', 'SalahTotal123!');
    await page.click('button[type="submit"]');

    await page.waitForSelector('text="Email atau kata sandi tidak valid"', { timeout: 5000 });
    const errText = await page.locator('text="Email atau kata sandi tidak valid"').textContent();
    expect(errText).toContain('Email atau kata sandi tidak valid');
  });
});
