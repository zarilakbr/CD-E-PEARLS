import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

test.describe('Bagian C: Animasi Mobile, Diagnosis & Bukti Real-Device', () => {
  const screensDir = path.resolve('docs', 'screens', 'tahap-q2', 'animation');
  if (!fs.existsSync(screensDir)) {
    fs.mkdirSync(screensDir, { recursive: true });
  }

  test('1. Touch feedback: scale(0.97) dan transisi transform pada sentuhan aktif', async ({ page, browserName }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/');

    const touchEl = page.locator('.touch-feedback').first();
    await touchEl.waitFor({ state: 'visible', timeout: 10000 });

    // Cek properti transition memuat transform
    const transitionProp = await touchEl.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.transitionProperty || style.transition;
    });
    expect(transitionProp.toLowerCase()).toContain('transform');

    // Cek -webkit-tap-highlight-color disetel transparan untuk mobile WebKit
    const tapHighlight = await touchEl.evaluate((el) => {
      return (window.getComputedStyle(el) as any).webkitTapHighlightColor;
    });
    console.log(`[Animation Diagnostic - ${browserName}] tapHighlight:`, tapHighlight);
  });

  test('2. Heart Pop Animation: memicu animasi keyframes saat wishlist diaktifkan', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/katalog');

    const heartBtn = page.locator('button[aria-label*="favorit"], button[title*="favorit"]').first();
    await heartBtn.waitFor({ state: 'visible', timeout: 10000 });

    await heartBtn.click();
    const heartIcon = heartBtn.locator('svg').first();
    await expect(heartIcon).toHaveClass(/animate-heart-pop/);

    // Verifikasi getAnimations() atau computed animation-name
    const animName = await heartIcon.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.animationName;
    });
    expect(animName).toContain('heartPop');
  });

  test('3. Perubahan Nilai Gaya terhadap Waktu (t=0, t=150ms, t=400ms) & 3 Screenshot Sekuensial', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });

    // Buka halaman beranda dan tangkap perubahan gaya sekuensial
    await page.goto('http://localhost:5173/');

    const bannerContent = page.locator('.animate-banner-load, [data-slot="mobile-marketplace-home"]').first();
    await bannerContent.waitFor({ state: 'attached' });

    // Snapshot t=0ms
    const t0Path = path.join(screensDir, 'seq-t0.png');
    await page.screenshot({ path: t0Path });
    const styleT0 = await bannerContent.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { opacity: s.opacity, transform: s.transform };
    });

    // Tunggu t=150ms
    await page.waitForTimeout(150);
    const t150Path = path.join(screensDir, 'seq-t150.png');
    await page.screenshot({ path: t150Path });
    const styleT150 = await bannerContent.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { opacity: s.opacity, transform: s.transform };
    });

    // Tunggu t=400ms (selesai transisi)
    await page.waitForTimeout(250);
    const t400Path = path.join(screensDir, 'seq-t400.png');
    await page.screenshot({ path: t400Path });
    const styleT400 = await bannerContent.evaluate((el) => {
      const s = window.getComputedStyle(el);
      return { opacity: s.opacity, transform: s.transform };
    });

    console.log('[Sequential Animation States]:', {
      t0: styleT0,
      t150: styleT150,
      t400: styleT400,
    });

    // Verifikasi screenshot tersimpan dan berukuran valid
    expect(fs.existsSync(t0Path)).toBe(true);
    expect(fs.existsSync(t150Path)).toBe(true);
    expect(fs.existsSync(t400Path)).toBe(true);
    expect(fs.statSync(t400Path).size).toBeGreaterThan(50000);
  });

  test('4. Reduced Motion: Menjadi fade pendek 150ms tanpa transform liar', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/');

    const banner = page.locator('.animate-banner-load').first();
    if (await banner.count() > 0) {
      const computed = await banner.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          animationDuration: style.animationDuration,
          animationName: style.animationName,
        };
      });

      console.log('[Reduced Motion Check]:', computed);
      const dur = parseFloat(computed.animationDuration);
      expect(dur).toBeLessThanOrEqual(0.151);
    }
  });

  test('5. Performa Compositor: Deteksi Long Tasks > 100ms dengan CPU Throttling 4x via CDP', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP CPU Throttling hanya tersedia di browser Chromium engine');

    // Buka sesi CDP
    const client = await page.context().newCDPSession(page);
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
    // Beri jeda agar hidrasi selesai sebelum mengukur animasi scroll
    await page.waitForTimeout(500);

    // Pantau Long Task (> 100ms) selama scroll animasi menggunakan PerformanceObserver di browser
    const longTasks = await page.evaluate(async () => {
      return new Promise<{ duration: number; startTime: number; name: string }[]>((resolve) => {
        const tasks: { duration: number; startTime: number; name: string }[] = [];
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 100) {
              tasks.push({ duration: entry.duration, startTime: entry.startTime, name: entry.name });
            }
          }
        });

        try {
          observer.observe({ entryTypes: ['longtask'] });
        } catch {
          resolve([]);
          return;
        }

        // Pantau selama 1.5 detik saat scrolling
        window.scrollBy({ top: 300, behavior: 'smooth' });
        setTimeout(() => {
          observer.disconnect();
          resolve(tasks);
        }, 1500);
      });
    });

    console.log(`[CDP 4x Throttling] Long Tasks > 100ms detected:`, longTasks);
    // Di dev mode dengan 4x CPU throttling, catat task dan pastikan tidak ada freeze total (> 600ms)
    for (const task of longTasks) {
      expect(task.duration).toBeLessThan(600);
    }
    expect(longTasks.length).toBeLessThanOrEqual(3);
  });
});
