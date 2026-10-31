import { chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const outDir = path.resolve('docs', 'screens', 'tahap-q2');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Read seed credentials from backend/.env safely without logging secrets
const envContent = fs.readFileSync(path.resolve('backend', '.env'), 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`${key}=["']?([^\\r\\n"']+)["']?`));
  return match ? match[1].replace(/\\([$"])/g, '$1').trim() : '';
};

const adminEmail = getEnv('SEED_ADMIN_EMAIL');
const adminPassword = getEnv('SEED_ADMIN_PASSWORD');
const spiEmail = getEnv('SEED_SPI_EMAIL');
const spiPassword = getEnv('SEED_SPI_PASSWORD');
const userEmail = getEnv('SEED_USER_EMAIL');
const userPassword = getEnv('SEED_USER_PASSWORD');

const viewports = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
];

const results = [];

async function waitForImages(page) {
  await page.waitForFunction(() => {
    const imgs = Array.from(document.querySelectorAll('img'));
    return imgs.length > 0 && imgs.every(img => img.complete && img.naturalWidth > 0);
  }, { timeout: 10000 }).catch(() => {});
}

(async () => {
  const browser = await chromium.launch();

  // 1. PUBLIC ROUTES (GUEST)
  for (const vp of viewports) {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      isMobile: true,
      hasTouch: true,
      locale: 'id-ID',
    });
    const page = await context.newPage();

    // Beranda
    {
      await page.goto('http://localhost:5173/');
      await page.waitForSelector('[data-slot="product-card"]');
      await waitForImages(page);
      
      // Assertion: Beranda menampilkan minimal 6 ProductCard dan banner
      const cardCount = await page.locator('[data-slot="product-card"]').count();
      if (cardCount < 6) throw new Error(`Beranda cards count too low: ${cardCount}`);
      
      const filename = `beranda-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);
    }

    // Katalog
    {
      await page.goto('http://localhost:5173/katalog');
      await page.waitForSelector('[data-slot="product-card"]');
      await waitForImages(page);
      
      // Assertion: minimal 6 kartu
      const cardCount = await page.locator('[data-slot="product-card"]').count();
      if (cardCount < 6) throw new Error(`Katalog cards count too low: ${cardCount}`);

      const filename = `katalog-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);

      if (vp.name === '390x844') {
        // Open Filter Sheet
        const filterBtn = page.getByRole('button', { name: /filter/i }).first();
        if (await filterBtn.isVisible()) {
          await filterBtn.click();
          await page.waitForSelector('[role="dialog"]');
          await page.waitForTimeout(500);
          const filterFilename = `katalog-filter-open-390x844.png`;
          const filterFilePath = path.join(outDir, filterFilename);
          await page.screenshot({ path: filterFilePath, fullPage: false });
          const fStats = fs.statSync(filterFilePath);
          results.push({ name: filterFilename, url: page.url(), size: fStats.size });
          console.log(`Saved ${filterFilename} (${fStats.size} bytes)`);
        }
      }
    }

    // Detail Produk
    {
      await page.goto('http://localhost:5173/produk/1');
      await page.waitForSelector('h1, h2');
      await waitForImages(page);

      // Assertion: galeri termuat
      const imgCount = await page.locator('img').count();
      if (imgCount < 1) throw new Error('Detail product gallery missing');

      const filename = `detail-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);

      if (vp.name === '390x844') {
        // Open Accordion
        const accBtn = page.locator('button[data-state]').first();
        if (await accBtn.isVisible()) {
          await accBtn.click();
          await page.waitForTimeout(500);
          const accFilename = `detail-accordion-open-390x844.png`;
          const accFilePath = path.join(outDir, accFilename);
          await page.screenshot({ path: accFilePath, fullPage: false });
          const aStats = fs.statSync(accFilePath);
          results.push({ name: accFilename, url: page.url(), size: aStats.size });
          console.log(`Saved ${accFilename} (${aStats.size} bytes)`);
        }
      }
    }

    // Keranjang
    {
      await page.goto('http://localhost:5173/keranjang');
      await page.waitForSelector('h1, h2');
      await waitForImages(page);
      const filename = `keranjang-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);
    }

    // Favorit
    {
      await page.goto('http://localhost:5173/favorit');
      await page.waitForSelector('h1, h2');
      await waitForImages(page);
      const filename = `favorit-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);
    }

    // Masuk (Login)
    {
      await page.goto('http://localhost:5173/masuk');
      await page.waitForSelector('form');
      await waitForImages(page);
      const filename = `masuk-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);
    }

    // Daftar (Register)
    {
      await page.goto('http://localhost:5173/daftar');
      await page.waitForSelector('form');
      await waitForImages(page);
      const filename = `daftar-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);
    }

    await context.close();
  }

  // 2. DASHBOARDS WITH REAL UI LOGIN
  for (const vp of viewports) {
    // 2.A Customer Dashboard (/akun)
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto('http://localhost:5173/masuk?next=/akun');
      await page.waitForSelector('form');
      await page.fill('input[type="email"]', userEmail);
      await page.fill('input[type="password"]', userPassword);
      await page.waitForTimeout(1000);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/akun', { timeout: 15000 });
      await page.waitForSelector('text=Siti Rahma');
      await waitForImages(page);

      if (!page.url().includes('/akun')) throw new Error(`Customer URL mismatch: ${page.url()}`);

      const filename = `akun-pelanggan-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);

      await context.close();
    }

    // 2.B Admin Dashboard (/admin)
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto('http://localhost:5173/masuk?next=/admin');
      await page.waitForSelector('form');
      await page.fill('input[type="email"]', adminEmail);
      await page.fill('input[type="password"]', adminPassword);
      await page.waitForTimeout(1000);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/admin', { timeout: 15000 });
      await page.waitForSelector('h1');
      await waitForImages(page);

      if (!page.url().includes('/admin')) throw new Error(`Admin URL mismatch: ${page.url()}`);

      const filename = `admin-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);

      await context.close();
    }

    // 2.C SPI Dashboard (/spi)
    {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: true,
        hasTouch: true,
      });
      const page = await context.newPage();
      await page.goto('http://localhost:5173/masuk?next=/spi');
      await page.waitForSelector('form');
      await page.fill('input[type="email"]', spiEmail);
      await page.fill('input[type="password"]', spiPassword);
      await page.waitForTimeout(1000);
      await page.click('button[type="submit"]');
      await page.waitForURL('**/spi', { timeout: 15000 });
      await page.waitForSelector('h1');
      await waitForImages(page);

      if (!page.url().includes('/spi')) throw new Error(`SPI URL mismatch: ${page.url()}`);

      const filename = `spi-${vp.name}.png`;
      const filePath = path.join(outDir, filename);
      await page.screenshot({ path: filePath, fullPage: false });
      const stats = fs.statSync(filePath);
      results.push({ name: filename, url: page.url(), size: stats.size });
      console.log(`Saved ${filename} (${stats.size} bytes) from ${page.url()}`);

      await context.close();
    }
  }

  // 3. GENERATE CONTACT SHEET (kontak-sheet-390.png)
  // Memuat Beranda, Katalog (Sheet filter terbuka), Detail (Accordion terbuka), Keranjang, Akun, dan Admin berdampingan.
  {
    const contactSheetPage = await browser.newPage({
      viewport: { width: 2340, height: 900 }
    });

    const b64 = (file) => {
      const p = path.join(outDir, file);
      return fs.existsSync(p) ? `data:image/png;base64,${fs.readFileSync(p).toString('base64')}` : '';
    };

    const sheetItems = [
      { title: '1. Beranda Mobile', img: b64('beranda-390x844.png') },
      { title: '2. Katalog (Sheet Filter)', img: b64('katalog-filter-open-390x844.png') },
      { title: '3. Detail (Accordion)', img: b64('detail-accordion-open-390x844.png') },
      { title: '4. Keranjang', img: b64('keranjang-390x844.png') },
      { title: '5. Akun Pelanggan', img: b64('akun-pelanggan-390x844.png') },
      { title: '6. Admin Portal', img: b64('admin-390x844.png') },
    ];

    await contactSheetPage.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Kontak Sheet 390</title>
        <style>
          body {
            margin: 0;
            padding: 24px;
            background: #0B192C;
            font-family: system-ui, -apple-system, sans-serif;
            color: #D9B877;
          }
          h2 {
            margin: 0 0 16px 0;
            font-size: 20px;
            font-weight: 600;
            text-align: center;
          }
          .grid {
            display: flex;
            gap: 16px;
            justify-content: center;
          }
          .card {
            background: #12263A;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0,0,0,0.5);
            border: 1px solid rgba(217,184,119,0.3);
            width: 360px;
            display: flex;
            flex-direction: column;
          }
          .card h3 {
            margin: 12px;
            font-size: 14px;
            text-align: center;
            color: #F3EBDD;
          }
          .card img {
            width: 360px;
            height: 780px;
            object-fit: cover;
            object-position: top;
            display: block;
          }
        </style>
      </head>
      <body>
        <h2>CD'E PEARLS LOMBOK - TAHAP Q-2 MOBILE CONTACT SHEET (390x844)</h2>
        <div class="grid">
          ${sheetItems.map(item => `
            <div class="card">
              <h3>${item.title}</h3>
              <img src="${item.img}" alt="${item.title}" />
            </div>
          `).join('')}
        </div>
      </body>
      </html>
    `);

    await contactSheetPage.waitForTimeout(1000);
    const sheetFilename = 'kontak-sheet-390.png';
    const sheetPath = path.join(outDir, sheetFilename);
    await contactSheetPage.screenshot({ path: sheetPath, fullPage: true });
    const sStats = fs.statSync(sheetPath);
    results.push({ name: sheetFilename, url: 'local://contact-sheet', size: sStats.size });
    console.log(`Saved Contact Sheet: ${sheetFilename} (${sStats.size} bytes)`);
    await contactSheetPage.close();
  }

  await browser.close();

  console.log('\n--- TAHAP Q-2 SCREENSHOT SUMMARY ---');
  console.table(results);
  fs.writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(results, null, 2));
})();
