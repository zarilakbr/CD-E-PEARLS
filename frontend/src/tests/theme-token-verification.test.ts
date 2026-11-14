import { describe, it, expect } from 'vitest';

const rawFiles = import.meta.glob<string>(
  [
    '../pages/customer/CustomerPortal.tsx',
    '../pages/admin/AdminPortal.tsx',
    '../pages/spi/SpiPortal.tsx',
    '../pages/site/CartPage.tsx',
    '../pages/site/CheckoutPage.tsx',
    '../components/product/ProductDetailModal.tsx',
    '../components/common/ProofImage.tsx',
    '../components/common/StatusBadge.tsx',
  ],
  { query: '?raw', import: 'default', eager: true }
);

describe('Tahap V5: Verifikasi Token Tema & Bebas Warna Tetap', () => {
  const targetKeys = [
    '../pages/customer/CustomerPortal.tsx',
    '../pages/admin/AdminPortal.tsx',
    '../pages/spi/SpiPortal.tsx',
    '../pages/site/CartPage.tsx',
    '../pages/site/CheckoutPage.tsx',
    '../components/product/ProductDetailModal.tsx',
    '../components/common/ProofImage.tsx',
    '../components/common/StatusBadge.tsx',
  ];

  const fixedColorPattern = /(bg-white|bg-\[#F[0-9a-fA-F]{3,6}\]|text-\[#12263A\]|border-\[#E6DDD0\])/;

  targetKeys.forEach((key) => {
    it(`memastikan ${key} tidak lagi memuat warna tetap tanpa token tema atau pasangan dark:`, () => {
      const content = rawFiles[key];
      expect(content).toBeDefined();

      const lines = content.split('\n');
      const violations: { line: number; text: string }[] = [];

      lines.forEach((line: string, idx: number) => {
        if (fixedColorPattern.test(line) && !line.includes('dark:')) {
          violations.push({ line: idx + 1, text: line.trim() });
        }
      });

      expect(violations).toEqual([]);
    });
  });

  it('memastikan StatusBadge menggunakan kelas semantik token tema', () => {
    const content = rawFiles['../components/common/StatusBadge.tsx'];
    expect(content).toBeDefined();

    expect(content).toContain('badge-status-warning');
    expect(content).toContain('badge-status-info');
    expect(content).toContain('badge-status-success');
    expect(content).toContain('badge-status-danger');
    expect(content).toContain('badge-status-neutral');
    expect(content).not.toContain('style={{ backgroundColor: bg, color: text }}');
  });

  it('memastikan index.css mendefinisikan token semantik terang dan gelap', async () => {
    const modFs = 'fs';
    const modPath = 'path';
    const fs: any = await import(/* @vite-ignore */ modFs);
    const path: any = await import(/* @vite-ignore */ modPath);
    const cwd = (globalThis as any).process?.cwd?.() || '.';
    const cssPath = path.resolve(cwd, 'src/index.css');
    const indexCss: string = fs.readFileSync(cssPath, 'utf-8');

    expect(indexCss).toBeDefined();
    expect(indexCss).toContain('--warning-bg:');
    expect(indexCss).toContain('--warning-text:');
    expect(indexCss).toContain('--info-bg:');
    expect(indexCss).toContain('--info-text:');
    expect(indexCss).toContain('--success-bg:');
    expect(indexCss).toContain('--success-text:');
    expect(indexCss).toContain('--danger-bg:');
    expect(indexCss).toContain('--danger-text:');
    expect(indexCss).toContain('--input-bg:');
    expect(indexCss).toContain('--input-border:');
  });
});
