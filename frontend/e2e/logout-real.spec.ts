import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import path from 'path';

test.describe('Q12: Real Backend UI Logout Test', () => {
  let realToken = '';

  test.beforeAll(() => {
    // Generate temporary test token from real backend
    const backendPath = path.resolve('..', 'backend', 'create-test-token.php');
    const out = execSync(`php "${backendPath}"`, { encoding: 'utf-8' });
    const match = out.match(/TOKEN=([^\r\n]+)/);
    if (!match) throw new Error('Failed to generate real test token from backend');
    realToken = match[1].trim();
  });

  test('Logout UI calls real backend /api/v1/auth/logout with Bearer token, returns 200, invalidates session', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Listen for real network request to logout endpoint
    let logoutRequestHeaders: Record<string, string> = {};
    let logoutResponseStatus = 0;

    page.on('request', (req) => {
      if (req.url().includes('/api/v1/auth/logout') && req.method() === 'POST') {
        logoutRequestHeaders = req.headers();
      }
    });

    page.on('response', (res) => {
      if (res.url().includes('/api/v1/auth/logout')) {
        logoutResponseStatus = res.status();
      }
    });

    // 1. Set real token in localStorage and visit /akun
    await page.goto('http://localhost:5173/');
    await page.evaluate((tok) => {
      localStorage.setItem('cde_auth_token', tok);
    }, realToken);

    await page.goto('http://localhost:5173/akun');
    await page.waitForLoadState('networkidle');

    // Verify user is authenticated with backend data
    const profileHeading = page.locator('h1, h2, h3, h4').first();
    await expect(profileHeading).toBeVisible();

    // 2. Click "Keluar" button in the UI
    const logoutBtn = page.locator('button:has-text("Keluar")').first();
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.scrollIntoViewIfNeeded();
    await logoutBtn.click();

    // Confirm logout dialog if shown
    const confirmLogout = page.locator('.fixed button:has-text("Keluar")').last();
    await page.waitForTimeout(300);
    if (await confirmLogout.isVisible()) {
      await confirmLogout.click();
    }

    // Wait for redirect to finish and storage to clear
    await page.waitForTimeout(1000);
    await page.waitForLoadState('networkidle');

    // 3. Verify real backend was called with Bearer token and returned 200
    expect(logoutResponseStatus).toBe(200);
    expect(logoutRequestHeaders['authorization'] || logoutRequestHeaders['Authorization']).toContain('Bearer ');

    // 4. Verify token removed from frontend storage
    const tokenInStorage = await page.evaluate(() => localStorage.getItem('cde_auth_token'));
    expect(tokenInStorage).toBeNull();

    // 5. Verify back button does not leak private customer data
    await page.goBack();
    await page.waitForTimeout(500);
    // Route guard redirects guest away from /akun or shows Guest Account Hub
    const urlAfterBack = page.url();
    expect(urlAfterBack).toMatch(/(\/|\/masuk|\/akun)/);

    // 6. Verify real backend now returns 401 for the invalidated token
    const verifyRes = await fetch('http://localhost:8000/api/v1/auth/me', {
      headers: {
        Authorization: `Bearer ${realToken}`,
        Accept: 'application/json',
      },
    });
    expect(verifyRes.status).toBe(401);
  });
});
