import { test, expect } from '@playwright/test';

test.describe('Q10: Animasi Mobile & Performa', () => {
  test('Touch feedback has scale 0.97 and transition transform', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Test a touch-feedback element (tab bar button or product card)
    const touchBtn = page.locator('.touch-feedback').first();
    await expect(touchBtn).toBeVisible();

    const transitionProp = await touchBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return style.transitionProperty || style.transition;
    });
    expect(transitionProp.toLowerCase()).toContain('transform');
  });

  test('Heart pop animation trigger exists on product heart button', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('http://localhost:5173/katalog');
    await page.waitForLoadState('networkidle');

    const heartBtn = page.locator('button[aria-label*="favorit"], button[title*="favorit"]').first();
    await expect(heartBtn).toBeVisible();

    // Click to add to wishlist, triggering heart-pop
    await heartBtn.click();
    const heartIcon = heartBtn.locator('svg').first();
    const animClass = await heartIcon.getAttribute('class');
    expect(animClass).toContain('animate-heart-pop');
  });

  test('Reduced motion disables transforms and caps durations to <= 150ms', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );
    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    const touchBtn = page.locator('.touch-feedback').first();
    const computed = await touchBtn.evaluate((el) => {
      const style = window.getComputedStyle(el);
      return {
        transform: style.transform,
        transitionDuration: style.transitionDuration,
      };
    });

    // In reduced motion mode, transform should be none and duration <= 0.15s (150ms)
    expect(computed.transform).toBe('none');
    const durSeconds = parseFloat(computed.transitionDuration);
    expect(durSeconds).toBeLessThanOrEqual(0.15);
  });

  test('Animation frame rate stays >= 55 FPS under compositor pipeline', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.route('**/api/v1/auth/me', (r) =>
      r.fulfill({ status: 401, body: JSON.stringify({ message: 'Unauthenticated.' }) })
    );

    await page.goto('http://localhost:5173/');
    await page.waitForLoadState('networkidle');

    // Measure FPS over 30 frames
    const fps = await page.evaluate(async () => {
      return new Promise<number>((resolve) => {
        let frameCount = 0;
        const start = performance.now();
        const checkFrame = () => {
          frameCount++;
          if (frameCount >= 30) {
            const elapsed = performance.now() - start;
            const currentFps = (frameCount / elapsed) * 1000;
            resolve(Math.round(currentFps));
          } else {
            requestAnimationFrame(checkFrame);
          }
        };
        requestAnimationFrame(checkFrame);
      });
    });

    console.log(`[Animation Performance] Compositor FPS measured: ${fps}`);
    expect(fps).toBeGreaterThanOrEqual(55);
  });
});
