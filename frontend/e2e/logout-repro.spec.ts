import { test, expect } from '@playwright/test';

test.describe('Tahap O - Bagian 3: Bug Logout Verifikasi', () => {
  test('a & b & f: login sebagai admin, logout, url menjadi /, tekan back tidak muncul admin, refresh tetap tamu', async ({ page }) => {
    let isAuthenticated = true;

    // Mock user admin saat me dipanggil
    await page.route('**/api/v1/auth/me', async (route) => {
      if (isAuthenticated) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 2,
              name: 'Budi Santoso',
              email: 'admin@cdepearls.com',
              role: 'admin',
              status: 'active',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
        });
      }
    });

    await page.route('**/api/v1/auth/logout', async (route) => {
      isAuthenticated = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Sesi berakhir' }),
      });
    });

    // Buka dulu untuk inisialisasi context, lalu set token di localStorage
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('cde_auth_token', 'admin-test-token');
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    // Pastikan berada di dashboard admin
    const adminHeading = page.locator('h1:has-text("Ringkasan Toko")');
    await expect(adminHeading).toBeVisible();

    // Klik tombol profil untuk logout
    const profileBtn = page.getByRole('button', { name: /(menu profil pengguna|view profile)/i });
    await profileBtn.click();

    const logoutMenuItem = page.getByRole('menuitem', { name: /(keluar|logout|sign out)/i });
    await logoutMenuItem.click();

    // Verifikasi a: URL menjadi "/" dan header menampilkan Masuk dan Daftar
    await expect(page).toHaveURL('/');
    const masukLink = page.locator('a[href="/masuk"]').first();
    const daftarLink = page.locator('a[href="/daftar"]').first();
    await expect(masukLink).toBeVisible();
    await expect(daftarLink).toBeVisible();

    // Verifikasi b: Tekan Back - konten admin tidak boleh muncul (halaman login atau beranda tampil)
    await page.goBack();
    await expect(page.locator('h1:has-text("Ringkasan Toko")')).not.toBeVisible();
    await expect(page).toHaveURL(/\/masuk|\//);

    // Verifikasi f: Refresh halaman beranda - tetap sebagai tamu
    await page.goto('/');
    await page.reload();
    await expect(page.locator('a[href="/masuk"]').first()).toBeVisible();
    await expect(page.locator('h1:has-text("Ringkasan Toko")')).not.toBeVisible();
  });

  test('c: buka /admin langsung sebagai tamu diarahkan ke /masuk?next=/admin', async ({ page }) => {
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
      });
    });

    await page.goto('/admin');
    await page.waitForLoadState('networkidle');

    await expect(page).toHaveURL(/\/masuk\?next=(%2Fadmin|\/admin)/);
  });

  test('d: login sebagai pelanggan tidak ada nama atau data admin di mana pun', async ({ page }) => {
    await page.route('**/api/v1/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: {
            id: 1,
            name: 'Dewi Pelanggan',
            email: 'dewi@pelanggan.com',
            role: 'user',
            status: 'active',
          },
        }),
      });
    });

    await page.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'user-test-token');
    });

    await page.goto('/akun');
    await page.waitForLoadState('networkidle');

    // Nama pelanggan tampil
    await expect(page.getByText('Dewi Pelanggan').first()).toBeVisible();

    // Nama admin "Budi Santoso" atau "Admin Operasional" tidak boleh ada di DOM
    await expect(page.getByText('Budi Santoso')).toHaveCount(0);
  });

  test('e: dua tab - logout di tab A, tab B ikut keluar', async ({ context }) => {
    let isAuthenticated = true;

    await context.route('**/api/v1/auth/me', async (route) => {
      if (isAuthenticated) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            user: {
              id: 2,
              name: 'Budi Santoso',
              email: 'admin@cdepearls.com',
              role: 'admin',
              status: 'active',
            },
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
        });
      }
    });

    await context.route('**/api/v1/auth/logout', async (route) => {
      isAuthenticated = false;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'Sesi berakhir' }),
      });
    });

    const pageA = await context.newPage();
    const pageB = await context.newPage();

    await pageA.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'admin-token');
    });
    await pageB.addInitScript(() => {
      localStorage.setItem('cde_auth_token', 'admin-token');
    });

    await pageA.goto('/admin');
    await pageB.goto('/admin');

    await expect(pageA.locator('h1:has-text("Ringkasan Toko")')).toBeVisible();
    await expect(pageB.locator('h1:has-text("Ringkasan Toko")')).toBeVisible();

    // Logout di Tab A
    const profileBtn = pageA.getByRole('button', { name: /(menu profil pengguna|view profile)/i });
    await profileBtn.click();
    await pageA.getByRole('menuitem', { name: /(keluar|logout|sign out)/i }).click();

    // Tab A kembali ke /
    await expect(pageA).toHaveURL('/');

    // Tab B harus otomatis keluar tanpa refresh manual
    await expect(pageB).toHaveURL('/', { timeout: 10000 });
    await expect(pageB.locator('a[href="/masuk"]').first()).toBeVisible();
  });
});
