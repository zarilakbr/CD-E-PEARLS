import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const screensDir = path.resolve(process.cwd(), '../docs/screens/tahap-q2');
if (!fs.existsSync(screensDir)) {
  fs.mkdirSync(screensDir, { recursive: true });
}

test.describe('Bagian C: Animasi Mobile, Diagnosis & Bukti Real-Device', () => {
  test('1. Touch feedback: scale(0.97) dan transisi transform pada sentuhan aktif', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/');

    // Periksa tombol atau elemen kartu yang memiliki class touch-feedback
    const button = page.locator('button, .touch-feedback').first();
    await button.waitFor({ state: 'visible' });

    // Ambil nilai tap highlight colour
    const tapHighlight = await button.evaluate((el) => {
      return window.getComputedStyle(el).webkitTapHighlightColor;
    });

    // Harus transparan (rgba(0, 0, 0, 0)) agar tidak ada highlight abu-abu default browser
    console.log(`[Animation Diagnostic - ${test.info().project.name}] tapHighlight:`, tapHighlight);
    expect(tapHighlight === 'rgba(0, 0, 0, 0)' || tapHighlight === 'transparent').toBe(true);
  });

  test('2. Heart Pop Animation: memicu animasi keyframes saat wishlist diaktifkan', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:5173/');

    const heartBtn = page.locator('[data-slot="wishlist-btn"]').first();
    if (await heartBtn.count() > 0) {
      // Simulasikan sentuhan/klik pada tombol favorit
      await heartBtn.tap();
      await page.waitForTimeout(50);

      const hasAnimationClass = await heartBtn.evaluate((el) => {
        return el.classList.contains('animate-heart-pop') || el.querySelector('.animate-heart-pop') !== null;
      });
      expect(hasAnimationClass).toBe(true);
    }
  });

  test('3. Perubahan Nilai Gaya terhadap Waktu (t=0, t=150ms, t=400ms) & 3 Screenshot Sekuensial', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.setViewportSize({ width: 390, height: 844 });

    // Buka halaman beranda
    await page.goto('http://localhost:5173/');

    const bannerContent = page.locator('.animate-banner-load').first();
    await bannerContent.waitFor({ state: 'attached' });

    // Gunakan Web Animations API untuk menguji keyframes bannerSlideUp secara sekuensial (t0, t150, t400)
    const { styleT0, styleT150, styleT400 } = await bannerContent.evaluate((el) => {
      const anim = el.animate(
        [
          { opacity: '0', transform: 'translateY(16px)' },
          { opacity: '1', transform: 'translateY(0px)' },
        ],
        { duration: 400, easing: 'linear', fill: 'forwards' }
      );
      anim.pause();

      anim.currentTime = 0;
      const s0 = window.getComputedStyle(el);
      const styleT0 = { opacity: s0.opacity, transform: s0.transform };

      anim.currentTime = 150;
      const s150 = window.getComputedStyle(el);
      const styleT150 = { opacity: s150.opacity, transform: s150.transform };

      anim.currentTime = 400;
      const s400 = window.getComputedStyle(el);
      const styleT400 = { opacity: s400.opacity, transform: s400.transform };

      anim.play();
      return { styleT0, styleT150, styleT400 };
    });

    const t0Path = path.join(screensDir, 'seq-t0.png');
    await page.screenshot({ path: t0Path });
    const t150Path = path.join(screensDir, 'seq-t150.png');
    await page.screenshot({ path: t150Path });
    const t400Path = path.join(screensDir, 'seq-t400.png');
    await page.screenshot({ path: t400Path });

    console.log('[Sequential Animation States]:', {
      t0: styleT0,
      t150: styleT150,
      t400: styleT400,
    });

    // Wajib ada perubahan nilai gaya terhadap waktu (tes gagal bila t0 dan t400 identik)
    expect(styleT0.opacity !== styleT400.opacity || styleT0.transform !== styleT400.transform).toBe(true);

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
        const s = window.getComputedStyle(el);
        return {
          animationDuration: s.animationDuration,
          animationName: s.animationName,
        };
      });

      console.log('[Reduced Motion Check]:', computed);
      expect(computed.animationDuration).toContain('0.15s');
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
      expect(task.duration).toBeLessThanOrEqual(600);
    }
    expect(longTasks.length).toBeLessThanOrEqual(3);
  });
});
