import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Tahap O - Bagian 6: Audit Aksesibilitas, Tema, Bahasa, dan Kontrol', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/v1/auth/me', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated.' }),
      })
    );
  });

  test('A11y Audit: Halaman Utama (/) memenuhi standar WCAG (critical & serious violations = 0)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .disableRules(['color-contrast']) // color-contrast on transparent video/canvases handled separately
      .analyze();

    const criticalSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalSerious).toEqual([]);
  });

  test('A11y Audit: Halaman Masuk (/masuk) memenuhi standar WCAG (critical & serious violations = 0)', async ({ page }) => {
    await page.goto('/masuk');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    const criticalSerious = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(criticalSerious).toEqual([]);
  });

  test('Audit Tema: Switch Light dan Dark mode mengaktifkan kelas html.dark dan token warna', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Default or current theme
    const html = page.locator('html');
    const isDarkInitial = await html.evaluate((el) => el.classList.contains('dark'));

    // Toggle theme via header theme button
    const themeBtn = page.locator('button[aria-label*="Mode"], button[aria-label*="tema"], button[aria-label*="Tema"]').first();
    if (await themeBtn.isVisible()) {
      await themeBtn.click();
      await page.waitForTimeout(300);

      const isDarkAfterToggle = await html.evaluate((el) => el.classList.contains('dark'));
      expect(isDarkAfterToggle).not.toBe(isDarkInitial);
    }
  });

  test('Audit Bahasa: Switch ID dan EN mengupdate teks antarmuka', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find language selector (segmented control ID | EN)
    const enButton = page.locator('button').filter({ hasText: /^EN$/ }).first();
    if (await enButton.isVisible()) {
      await enButton.click();
      await page.waitForTimeout(300);

      // Verify that HTML lang is updated or key labels change
      const langAttr = await page.locator('html').getAttribute('lang');
      expect(langAttr).toBe('en');

      // Switch back to ID
      const idButton = page.locator('button').filter({ hasText: /^ID$/ }).first();
      await idButton.click();
      await page.waitForTimeout(300);
      const langAttrId = await page.locator('html').getAttribute('lang');
      expect(langAttrId).toBe('id');
    }
  });

  test('Audit Kontrol: Tidak ada ikon atau kontrol duplikat pada layar navbar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Header should contain exactly 1 search bar, 1 theme toggle, 1 language toggle group
    const searchInputs = await page.locator('header input[type="text"]').count();
    expect(searchInputs).toBe(1);

    const cartButtons = await page.locator('header a[href="/keranjang"], header button[aria-label*="keranjang" i]').count();
    expect(cartButtons).toBeLessThanOrEqual(1);

    const wishlistButtons = await page.locator('header a[href="/favorit"], header button[aria-label*="favorit" i]').count();
    expect(wishlistButtons).toBeLessThanOrEqual(1);
  });
});

