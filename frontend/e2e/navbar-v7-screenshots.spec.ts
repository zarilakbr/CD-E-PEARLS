import { test } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Tahap V7: Navbar Responsive Screenshots', () => {
  const screenshotDir = path.resolve(process.cwd(), 'e2e/screenshots/tahap-v7');

  test.beforeAll(() => {
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
  });

  const resolutions = [
    { width: 1280, height: 800, label: '1280px' },
    { width: 1366, height: 768, label: '1366px' },
    { width: 1440, height: 900, label: '1440px' },
    { width: 1920, height: 1080, label: '1920px' },
  ];

  const themes = ['light', 'dark'] as const;

  for (const res of resolutions) {
    for (const theme of themes) {
      test(`Capture navbar ${res.label} ${theme} (closed & open)`, async ({ page }) => {
        await page.setViewportSize({ width: res.width, height: res.height });
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForSelector('#nav-koleksi-produk', { timeout: 10000 });

        // Set theme via documentElement or theme switch
        await page.evaluate((t) => {
          document.documentElement.setAttribute('data-theme', t);
          if (t === 'dark') {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
          localStorage.setItem('cde_theme', t);
        }, theme);

        await page.waitForTimeout(300);

        // 1. Screenshot state: Dropdown Closed
        const closedPath = path.join(
          screenshotDir,
          `navbar-${res.label}-${theme}-closed.png`
        );
        // Tangkap bagian header / navbar
        const header = page.locator('header[data-slot="mobile-header"]');
        if (await header.count() > 0) {
          await header.screenshot({ path: closedPath });
        } else {
          await page.screenshot({ path: closedPath, clip: { x: 0, y: 0, width: res.width, height: 120 } });
        }

        // 2. Screenshot state: Dropdown Open
        const trigger = page.locator('#nav-koleksi-produk');
        if (await trigger.count() > 0) {
          await trigger.hover();
          await page.waitForTimeout(300);

          const openPath = path.join(
            screenshotDir,
            `navbar-${res.label}-${theme}-open.png`
          );
          // Capture top viewport area with dropdown visible (height 450px)
          await page.screenshot({
            path: openPath,
            clip: { x: 0, y: 0, width: res.width, height: 450 },
          });
        }
      });
    }
  }
});
