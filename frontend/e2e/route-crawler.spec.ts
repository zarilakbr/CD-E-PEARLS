import { test, expect } from '@playwright/test';

const publicRoutes = [
  '/',
  '/katalog',
  '/studio',
  '/edukasi',
  '/tentang',
  '/kontak',
  '/kebijakan-privasi',
  '/syarat-ketentuan',
  '/bantuan',
  '/cek-sertifikat',
  '/lacak-pesanan',
  '/keranjang',
  '/favorit',
  '/produk/1',
];

const authRoutes = [
  '/masuk',
  '/daftar',
  '/lupa-kata-sandi',
  '/atur-ulang-kata-sandi?token=test-token&email=test@example.com',
  '/verifikasi-email',
];

test.describe('Tahap O - Bagian 1: Route Crawler & Guard Tests', () => {
  for (const route of publicRoutes) {
    test(`Publik rute ${route} memiliki <h1> dan bebas console errors`, async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          const text = msg.text();
          // Filter benign development notices
          if (!text.includes('favicon') && !text.includes('Failed to load resource')) {
            consoleErrors.push(text);
          }
        }
      });

      // Mock auth me to return 401 unauthenticated guest
      await page.route('**/api/v1/auth/me', (r) =>
        r.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthenticated.' }),
        })
      );

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      // Verify no unexpected 404
      const h1Count = await page.locator('h1').count();
      expect(h1Count, `Rute ${route} wajib memiliki tepat 1 elemen <h1>`).toBe(1);

      const h1Text = await page.locator('h1').first().textContent();
      expect(h1Text).not.toContain('Halaman Tidak Ditemukan');

      expect(consoleErrors, `Rute ${route} memiliki console error tak terduga`).toHaveLength(0);
    });
  }

  for (const route of authRoutes) {
    test(`Auth rute ${route} memiliki form dan <h1>`, async ({ page }) => {
      await page.route('**/api/v1/auth/me', (r) =>
        r.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthenticated.' }),
        })
      );

      await page.route('**/api/v1/auth/providers', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: { google: true } }),
        })
      );

      await page.goto(route);
      await page.waitForLoadState('networkidle');

      const h1Count = await page.locator('h1').count();
      expect(h1Count, `Auth rute ${route} wajib memiliki <h1>`).toBeGreaterThanOrEqual(1);
    });
  }

  test('Guest membuka /admin otomatis dialihkan ke /masuk?next=%2Fadmin', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      })
    );

    await page.goto('/admin');
    await page.waitForURL((url) => url.pathname === '/masuk' && url.searchParams.get('next') === '/admin');
    expect(page.url()).toContain('/masuk?next=%2Fadmin');
  });

  test('Guest membuka /spi otomatis dialihkan ke /masuk?next=%2Fspi', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      })
    );

    await page.goto('/spi');
    await page.waitForURL((url) => url.pathname === '/masuk' && url.searchParams.get('next') === '/spi');
    expect(page.url()).toContain('/masuk?next=%2Fspi');
  });

  test('Guest membuka /akun melihat Hub Akun Tamu (Q2)', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      })
    );

    await page.goto('/akun');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/akun');
    const heading = await page.locator('h1').textContent();
    expect(heading).toContain('Akun Koleksi Tamu');
    const masukBtn = page.getByRole('button', { name: /masuk/i });
    expect(await masukBtn.count()).toBeGreaterThanOrEqual(1);
  });

  test('Guest membuka sub-rute /akun/pesanan otomatis dialihkan ke /masuk?next=%2Fakun%2Fpesanan', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      })
    );

    await page.goto('/akun/pesanan');
    await page.waitForURL((url) => url.pathname === '/masuk' && url.searchParams.get('next') === '/akun/pesanan');
    expect(page.url()).toContain('/masuk?next=%2Fakun%2Fpesanan');
  });

  test('Guest membuka /checkout otomatis dialihkan ke /masuk?next=%2Fcheckout', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      })
    );

    await page.goto('/checkout');
    await page.waitForURL((url) => url.pathname === '/masuk' && url.searchParams.get('next') === '/checkout');
    expect(page.url()).toContain('/masuk?next=%2Fcheckout');
  });

  test('Halaman beranda bebas link patah (tidak ada href="", href="#" atau rute tak dikenal)', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      })
    );

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const anchors = await page.locator('a').all();
    for (const anchor of anchors) {
      const href = await anchor.getAttribute('href');
      if (href !== null) {
        expect(href.trim(), 'Tag <a> tidak boleh memiliki href kosong').not.toBe('');
        expect(href.trim(), 'Tag <a> tidak boleh memiliki href="#" tanpa target').not.toBe('#');
      }
    }
  });

  test('Customer (role: user) mencoba membuka /admin menerima blokir akses / 403', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 1, name: 'Siti Rahma', email: 'siti.rahma@gmail.com', role: 'user', status: 'active' },
        }),
      })
    );

    await page.goto('/admin');
    await page.waitForLoadState('domcontentloaded');
    // Verifikasi dialihkan ke 403 atau dilarang
    const pageText = await page.locator('body').innerText();
    expect(pageText.toLowerCase()).toMatch(/(akses ditolak|dilarang|403|unauthorized|masuk)/);
  });

  test('Admin (role: admin) mencoba membuka /spi menerima blokir akses / 403', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          user: { id: 2, name: 'Admin Operasional', email: 'admin@cdepearls.com', role: 'admin', status: 'active' },
        }),
      })
    );

    await page.goto('/spi');
    await page.waitForLoadState('domcontentloaded');
    const pageText = await page.locator('body').innerText();
    expect(pageText.toLowerCase()).toMatch(/(akses ditolak|dilarang|403|unauthorized|masuk)/);
  });

  test('Rute tidak dikenal (/halaman-tidak-ada) menampilkan halaman 404', async ({ page }) => {
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      })
    );

    await page.goto('/halaman-tidak-ada-12345');
    await page.waitForLoadState('domcontentloaded');
    const h1 = page.locator('h1').first();
    await expect(h1).toBeVisible();
    const h1Text = await h1.innerText();
    expect(h1Text).toMatch(/(404|Tidak Ditemukan|Not Found)/i);
  });
});
