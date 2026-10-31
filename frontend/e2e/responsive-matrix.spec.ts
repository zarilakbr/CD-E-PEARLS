import { test, expect } from '@playwright/test';

const viewports = [
  { name: '320px', width: 320, height: 568 },
  { name: '360px Portrait', width: 360, height: 740 },
  { name: '360px Landscape', width: 740, height: 360 },
  { name: '375px', width: 375, height: 667 },
  { name: '390px Portrait', width: 390, height: 844 },
  { name: '390px Landscape', width: 844, height: 390 },
  { name: '412px', width: 412, height: 915 },
  { name: '768px', width: 768, height: 1024 },
  { name: '1024px', width: 1024, height: 768 },
  { name: '1280px', width: 1280, height: 800 },
  { name: '1920px', width: 1920, height: 1080 },
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

