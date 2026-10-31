import { test, expect } from '@playwright/test';

const viewports = [
  { name: 'Mobile Kecil (iPhone SE 1)', width: 320, height: 568 },
  { name: 'Mobile Standar (iPhone SE 2)', width: 375, height: 667 },
  { name: 'Mobile Besar (iPhone XR)', width: 414, height: 896 },
  { name: 'Tablet Portrait (iPad)', width: 768, height: 1024 },
  { name: 'Tablet Landscape (iPad Pro)', width: 1024, height: 1366 },
  { name: 'Desktop Standar', width: 1280, height: 800 },
  { name: 'Desktop Besar', width: 1440, height: 900 },
  { name: 'Desktop Ultra Wide', width: 1920, height: 1080 },
];

const testRoutes = [
  '/',
  '/masuk',
  '/daftar',
  '/katalog',
  '/syarat-ketentuan',
  '/kontak',
  '/bantuan',
];

test.describe('Tahap O - Bagian 5: Matriks Responsif 8 Viewport Bebas Overflow', () => {
  for (const vp of viewports) {
    test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of testRoutes) {
        test(`Rute ${route} bebas horizontal overflow pada ${vp.width}px`, async ({ page }) => {
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

          // Verifikasi tidak ada horizontal overflow (scrollWidth <= innerWidth)
          const overflowInfo = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            return {
              scrollWidth: docWidth,
              innerWidth: winWidth,
              hasOverflow: docWidth > winWidth + 1, // 1px tolerance for subpixel rounding
            };
          });

          expect(
            overflowInfo.hasOverflow,
            `Halaman ${route} mengalami horizontal overflow pada viewport ${vp.width}px: scrollWidth=${overflowInfo.scrollWidth} > innerWidth=${overflowInfo.innerWidth}`
          ).toBe(false);
        });
      }

      if (vp.width <= 414) {
        test(`Form login memiliki input font-size >= 16px untuk mencegah iOS zoom pada ${vp.width}px`, async ({ page }) => {
          await page.route('**/api/v1/auth/me', (r) =>
            r.fulfill({
              status: 401,
              contentType: 'application/json',
              body: JSON.stringify({ message: 'Unauthenticated.' }),
            })
          );

          await page.goto('/masuk');
          await page.waitForLoadState('networkidle');

          const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
          const count = await inputs.count();

          for (let i = 0; i < count; i++) {
            const fontSize = await inputs.nth(i).evaluate((el) => {
              return parseFloat(window.getComputedStyle(el).fontSize);
            });
            expect(fontSize, `Input index ${i} harus memiliki font-size minimal 16px`).toBeGreaterThanOrEqual(16);
          }
        });
      }
    });
  }
});

