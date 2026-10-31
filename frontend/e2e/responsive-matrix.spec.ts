import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// 12 Viewport sesuai spesifikasi Tahap Q-2 Bagian D
const viewports = [
  { name: '320px', width: 320, height: 568, isMobile: true },
  { name: '360px', width: 360, height: 740, isMobile: true },
  { name: '390px', width: 390, height: 844, isMobile: true },
  { name: '414px', width: 414, height: 896, isMobile: true },
  { name: '600px', width: 600, height: 960, isMobile: true },
  { name: '768px', width: 768, height: 1024, isMobile: false },
  { name: '1024px', width: 1024, height: 768, isMobile: false },
  { name: '1280px', width: 1280, height: 800, isMobile: false },
  { name: '1440px', width: 1440, height: 900, isMobile: false },
  { name: '1920px', width: 1920, height: 1080, isMobile: false },
  { name: 'Landscape 667x375', width: 667, height: 375, isMobile: true },
  { name: 'Landscape 844x390', width: 844, height: 390, isMobile: true },
];

const representativeRoutes = [
  { path: '/', name: 'Beranda' },
  { path: '/katalog', name: 'Katalog' },
  { path: '/produk/1', name: 'Detail Produk' },
  { path: '/keranjang', name: 'Keranjang' },
  { path: '/favorit', name: 'Favorit' },
  { path: '/masuk', name: 'Masuk' },
  { path: '/daftar', name: 'Daftar' },
  { path: '/akun', name: 'Akun Hub' },
];

const outDir = path.resolve('docs', 'screens', 'tahap-q2', 'responsive');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

test.describe('Bagian D: Matriks Responsif 12 Viewport & 7 Pemeriksaan Penuh', () => {
  for (const vp of viewports) {
    test.describe(`Viewport ${vp.name} (${vp.width}x${vp.height})`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of representativeRoutes) {
        test(`[${vp.name}] ${route.name} (${route.path}): 7 Pemeriksaan Tata Letak & Bebas Overflow`, async ({ page }) => {
          await page.goto(route.path);
          if (['/masuk', '/daftar'].includes(route.path)) {
            await page.waitForSelector('form', { timeout: 10000 });
          } else {
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(400);
          }

          // 1. Bebas Horizontal Overflow (scrollWidth <= innerWidth + 1)
          const overflow = await page.evaluate(() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            return {
              scrollWidth: docWidth,
              innerWidth: winWidth,
              hasOverflow: docWidth > winWidth + 1,
            };
          });
          expect(
            overflow.hasOverflow,
            `Halaman ${route.path} overflow pada ${vp.name}: scrollWidth=${overflow.scrollWidth} > innerWidth=${overflow.innerWidth}`
          ).toBe(false);

          // 2. Tidak ada elemen keluar batas kanan (kecuali yang di dalam wadah horizontal-scroll)
          const outOfBoundsCount = await page.evaluate(() => {
            const winW = window.innerWidth;
            const allElements = document.querySelectorAll('header, main, section, [data-slot="product-card"]');
            let count = 0;
            allElements.forEach((el) => {
              // Cek apakah elemen ada di dalam scroll container horizontal
              let isScrollChild = false;
              let p = el.parentElement;
              while (p && p !== document.body) {
                const s = window.getComputedStyle(p);
                if (s.overflowX === 'auto' || s.overflowX === 'scroll' || s.overflowX === 'hidden') {
                  isScrollChild = true;
                  break;
                }
                p = p.parentElement;
              }
              if (!isScrollChild) {
                const rect = el.getBoundingClientRect();
                if (rect.right > winW + 2) {
                  count++;
                }
              }
            });
            return count;
          });
          expect(outOfBoundsCount).toBe(0);

          // 3. Tab bar mobile: Harus muncul di mobile (< 1024px) dan sembunyi di desktop (>= 1024px)
          const tabBar = page.locator('nav[aria-label="Navigasi Utama Mobile"]');
          if (vp.width < 1024 && !['/masuk', '/daftar', '/produk/1'].includes(route.path)) {
            await tabBar.waitFor({ state: 'visible', timeout: 10000 });
            const isTabVisible = await tabBar.isVisible();
            expect(isTabVisible, `Bottom tab bar harus terlihat di mobile (${vp.name}) pada ${route.path}`).toBe(true);
          } else if (vp.width >= 1024) {
            const isTabVisible = await tabBar.isVisible().catch(() => false);
            expect(isTabVisible, `Bottom tab bar tidak boleh muncul di desktop (${vp.name})`).toBe(false);
          }

          // 4. Grid produk tepat 2 kolom pada 320px - 639px
          if (route.path === '/katalog' || route.path === '/') {
            if (vp.width >= 320 && vp.width <= 639) {
              const cardGrid = page.locator('[data-slot="product-grid"]').first();
              if (await cardGrid.isVisible().catch(() => false)) {
                const colsClass = await cardGrid.getAttribute('class');
                expect(colsClass).toContain('grid-cols-2');
              }
            }
          }

          // 5. Input font-size >= 16px pada layar mobile (<= 414px) untuk mencegah zoom iOS otomatis
          if (vp.width <= 414 && ['/masuk', '/daftar'].includes(route.path)) {
            const inputs = page.locator('input[type="email"], input[type="password"], input[type="text"]');
            const count = await inputs.count();
            for (let i = 0; i < count; i++) {
              const fontSize = await inputs.nth(i).evaluate((el) => parseFloat(window.getComputedStyle(el).fontSize));
              expect(fontSize, `Input index ${i} pada ${route.path} font-size harus >= 16px`).toBeGreaterThanOrEqual(16);
            }
          }

          // 6. Target sentuh minimal 44x44px pada tab bar mobile & tombol aksi utama
          if (vp.width < 768 && !['/masuk', '/daftar', '/produk/1'].includes(route.path)) {
            const bottomTabButtons = page.locator('nav[aria-label="Navigasi Utama Mobile"] button');
            const btnCount = await bottomTabButtons.count();
            for (let i = 0; i < btnCount; i++) {
              const box = await bottomTabButtons.nth(i).boundingBox();
              if (box) {
                expect(box.height, `Tab sentuh ${i} tinggi minimal 44px`).toBeGreaterThanOrEqual(44);
                expect(box.width, `Tab sentuh ${i} lebar minimal 44px`).toBeGreaterThanOrEqual(44);
              }
            }
          }

          // 7. Simpan screenshot representatif untuk bukti
          if (['360px', '390px', '1280px'].includes(vp.name) && ['/', '/katalog'].includes(route.path)) {
            const snapName = `${route.name.toLowerCase()}-${vp.width}x${vp.height}.png`;
            await page.screenshot({ path: path.join(outDir, snapName) });
          }
        });
      }
    });
  }
});
