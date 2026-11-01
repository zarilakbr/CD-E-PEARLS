import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import sharp from 'sharp';

const OUT_DIR = path.resolve('..', 'docs', 'screens', 'tahap-q3');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const BACKEND_DIR = path.resolve('..', 'backend');

function getToken(role) {
  try {
    const out = execSync(`php create-test-token.php ${role}`, { cwd: BACKEND_DIR, encoding: 'utf-8' });
    const match = out.match(/TOKEN=([^\r\n]+)/);
    return match ? match[1].trim() : '';
  } catch (err) {
    console.error(`Failed to get token for role ${role}:`, err.message);
    return '';
  }
}

const tokens = {
  admin: getToken('admin'),
  spi: getToken('spi'),
  user: getToken('user'),
};

console.log('Seeded tokens generated successfully.');

const BASE_URL = 'http://localhost:5173';

const VIEWPORTS = [
  { width: 360, height: 740, label: '360x740' },
  { width: 390, height: 844, label: '390x844' },
];

async function safeGoto(page, url) {
  if (url.includes('/masuk') || url.includes('/daftar')) {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('form', { timeout: 8000 }).catch(() => {});
  } else {
    await page.goto(url, { waitUntil: 'domcontentloaded' });
  }
  await page.waitForTimeout(600);
}

async function captureScreens() {
  const browser = await chromium.launch({ headless: true });
  const summary = [];

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();

    // 1. Beranda
    await safeGoto(page, `${BASE_URL}/`);
    const berandaFile = `beranda-${vp.label}.png`;
    const berandaPath = path.join(OUT_DIR, berandaFile);
    await page.screenshot({ path: berandaPath });
    summary.push({ name: berandaFile, url: `${BASE_URL}/`, size: fs.statSync(berandaPath).size });

    // 2. Katalog
    await safeGoto(page, `${BASE_URL}/katalog`);
    const katalogFile = `katalog-${vp.label}.png`;
    const katalogPath = path.join(OUT_DIR, katalogFile);
    await page.screenshot({ path: katalogPath });
    summary.push({ name: katalogFile, url: `${BASE_URL}/katalog`, size: fs.statSync(katalogPath).size });

    // Katalog Filter Open (390x844 only)
    if (vp.label === '390x844') {
      const filterBtn = page.locator('button:has-text("Filter")').first();
      if (await filterBtn.isVisible()) {
        await filterBtn.click();
        await page.waitForTimeout(500);
        const filterFile = `katalog-filter-open-${vp.label}.png`;
        const filterPath = path.join(OUT_DIR, filterFile);
        await page.screenshot({ path: filterPath });
        summary.push({ name: filterFile, url: `${BASE_URL}/katalog`, size: fs.statSync(filterPath).size });
        // close sheet
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }
    }

    // 3. Detail Produk
    await safeGoto(page, `${BASE_URL}/produk/1`);
    const detailFile = `detail-${vp.label}.png`;
    const detailPath = path.join(OUT_DIR, detailFile);
    await page.screenshot({ path: detailPath });
    summary.push({ name: detailFile, url: `${BASE_URL}/produk/1`, size: fs.statSync(detailPath).size });

    // Detail Accordion Open (390x844 only)
    if (vp.label === '390x844') {
      const accTrigger = page.locator('button:has-text("Deskripsi Produk"), button:has-text("Sertifikat Gemologi Lab")').first();
      if (await accTrigger.isVisible()) {
        await accTrigger.click();
        await page.waitForTimeout(500);
        const accFile = `detail-accordion-open-${vp.label}.png`;
        const accPath = path.join(OUT_DIR, accFile);
        await page.screenshot({ path: accPath });
        summary.push({ name: accFile, url: `${BASE_URL}/produk/1`, size: fs.statSync(accPath).size });
      }
    }

    // 4. Keranjang
    await safeGoto(page, `${BASE_URL}/keranjang`);
    const keranjangFile = `keranjang-${vp.label}.png`;
    const keranjangPath = path.join(OUT_DIR, keranjangFile);
    await page.screenshot({ path: keranjangPath });
    summary.push({ name: keranjangFile, url: `${BASE_URL}/keranjang`, size: fs.statSync(keranjangPath).size });

    // 5. Favorit
    await safeGoto(page, `${BASE_URL}/favorit`);
    const favoritFile = `favorit-${vp.label}.png`;
    const favoritPath = path.join(OUT_DIR, favoritFile);
    await page.screenshot({ path: favoritPath });
    summary.push({ name: favoritFile, url: `${BASE_URL}/favorit`, size: fs.statSync(favoritPath).size });

    // 6. Masuk
    await safeGoto(page, `${BASE_URL}/masuk`);
    const masukFile = `masuk-${vp.label}.png`;
    const masukPath = path.join(OUT_DIR, masukFile);
    await page.screenshot({ path: masukPath });
    summary.push({ name: masukFile, url: `${BASE_URL}/masuk`, size: fs.statSync(masukPath).size });

    // 7. Daftar
    await safeGoto(page, `${BASE_URL}/daftar`);
    const daftarFile = `daftar-${vp.label}.png`;
    const daftarPath = path.join(OUT_DIR, daftarFile);
    await page.screenshot({ path: daftarPath });
    summary.push({ name: daftarFile, url: `${BASE_URL}/daftar`, size: fs.statSync(daftarPath).size });

    await context.close();
  }

  // Dashboard pages (User, Admin, SPI) with real authenticated sessions
  for (const vp of VIEWPORTS) {
    // A. Akun Pelanggan (User)
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      await context.addInitScript((tok) => {
        localStorage.setItem('cde_auth_token', tok);
      }, tokens.user);
      const page = await context.newPage();
      await safeGoto(page, `${BASE_URL}/akun`);
      const userFile = `akun-pelanggan-${vp.label}.png`;
      const userPath = path.join(OUT_DIR, userFile);
      await page.screenshot({ path: userPath });
      summary.push({ name: userFile, url: `${BASE_URL}/akun`, size: fs.statSync(userPath).size });
      await context.close();
    }

    // B. Admin Dashboard
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      await context.addInitScript((tok) => {
        localStorage.setItem('cde_auth_token', tok);
      }, tokens.admin);
      const page = await context.newPage();
      await safeGoto(page, `${BASE_URL}/admin`);
      const adminFile = `admin-${vp.label}.png`;
      const adminPath = path.join(OUT_DIR, adminFile);
      await page.screenshot({ path: adminPath });
      summary.push({ name: adminFile, url: `${BASE_URL}/admin`, size: fs.statSync(adminPath).size });
      await context.close();
    }

    // C. SPI Dashboard
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      await context.addInitScript((tok) => {
        localStorage.setItem('cde_auth_token', tok);
      }, tokens.spi);
      const page = await context.newPage();
      await safeGoto(page, `${BASE_URL}/spi`);
      const spiFile = `spi-${vp.label}.png`;
      const spiPath = path.join(OUT_DIR, spiFile);
      await page.screenshot({ path: spiPath });
      summary.push({ name: spiFile, url: `${BASE_URL}/spi`, size: fs.statSync(spiPath).size });
      await context.close();
    }
  }

  // 8. Generate Contact Sheet kontak-sheet-390.png
  console.log('Generating contact sheet kontak-sheet-390.png...');
  const contactFiles = [
    'beranda-390x844.png',
    'katalog-filter-open-390x844.png',
    'detail-accordion-open-390x844.png',
    'keranjang-390x844.png',
    'akun-pelanggan-390x844.png',
    'admin-390x844.png',
  ];

  const sheetWidth = 390 * contactFiles.length; // 2340px
  const sheetHeight = 844;

  const composites = [];
  for (let i = 0; i < contactFiles.length; i++) {
    const filePath = path.join(OUT_DIR, contactFiles[i]);
    if (fs.existsSync(filePath)) {
      composites.push({
        input: filePath,
        left: i * 390,
        top: 0,
      });
    }
  }

  const contactSheetPath = path.join(OUT_DIR, 'kontak-sheet-390.png');
  await sharp({
    create: {
      width: sheetWidth,
      height: sheetHeight,
      channels: 4,
      background: { r: 18, g: 38, b: 58, alpha: 1 },
    },
  })
    .composite(composites)
    .png()
    .toFile(contactSheetPath);

  summary.push({
    name: 'kontak-sheet-390.png',
    url: 'local://contact-sheet',
    size: fs.statSync(contactSheetPath).size,
  });

  // Save summary.json
  const summaryPath = path.join(OUT_DIR, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

  console.log('=== TAHAP Q-3 SCREENSHOTS SUMMARY ===');
  console.log('| Nama File | URL Asal | Ukuran File |');
  console.log('| :--- | :--- | :--- |');
  for (const item of summary) {
    const sizeKb = (item.size / 1024).toFixed(1);
    console.log(`| ${item.name} | ${item.url} | ${sizeKb} KB (${item.size} B) |`);
  }

  await browser.close();
}

captureScreens().catch((err) => {
  console.error('Screenshot generation failed:', err);
  process.exit(1);
});
