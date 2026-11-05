import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { CatalogPage } from '../pages/site/CatalogPage';
import { catalogApi } from '../lib/api';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/api', () => ({
  catalogApi: {
    getProducts: vi.fn(),
    getCategories: vi.fn().mockResolvedValue([]),
  },
}));

describe('CatalogPage: State API & Pencabutan Total Mock Fallback', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  it('Keadaan 1: API Kosong ([]) -> menampilkan pesan "Koleksi Segera Hadir" dan 0 kartu produk', async () => {
    vi.mocked(catalogApi.getProducts).mockResolvedValueOnce({ data: [] });
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce([]);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/katalog']}>
          <CatalogPage onAddToCart={() => {}} onSelectProduct={() => {}} />
        </MemoryRouter>
      );
    });

    // Tunggu lifecycle state update
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const text = container.textContent || '';
    expect(text).toContain('Koleksi Segera Hadir');
    expect(text).toContain('Atelier perhiasan mutiara air laut Lombok kami sedang menyiapkan koleksi istimewa untuk Anda');

    // Pastikan tidak ada kartu produk lama yang muncul dari fallback mock
    expect(text).not.toContain('Kalung Mutiara South Sea Princess AAA');
    expect(text).not.toContain('Gelang Rantai Mutiara Emas Imperial');
    expect(text).not.toContain('Cincin Solitaire Tahitian Black Pearl 12mm');

    const productCards = container.querySelectorAll('[data-slot="product-card"]');
    expect(productCards.length).toBe(0);

    const images = Array.from(container.querySelectorAll('img')).map((img) => img.src);
    const hasTestProductImage = images.some((src) => src.includes('cat_ring_silk'));
    expect(hasTestProductImage).toBe(false);
  });

  it('Keadaan 2: API Galat (Network Error) -> menampilkan pesan galat tanpa menampilkan produk cadangan/mock', async () => {
    vi.mocked(catalogApi.getProducts).mockRejectedValueOnce(new Error('Network connection refused'));
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce([]);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/katalog']}>
          <CatalogPage onAddToCart={() => {}} onSelectProduct={() => {}} />
        </MemoryRouter>
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const text = container.textContent || '';
    expect(text).toContain('Gagal memuat katalog perhiasan. Periksa koneksi internet Anda.');
    expect(text).toContain('Coba Lagi');

    // Buktikan tidak ada fallback ke mock
    expect(text).not.toContain('Kalung Mutiara South Sea Princess AAA');
    expect(text).not.toContain('Gelang Rantai Mutiara Emas Imperial');
    const productCards = container.querySelectorAll('[data-slot="product-card"]');
    expect(productCards.length).toBe(0);
  });

  it('Keadaan 3: API Berisi (1 produk) -> merender kartu produk asli secara normal', async () => {
    const singleProduct = {
      id: 99,
      name: 'Mahkota Mutiara Emas Lombok 18K Solid',
      category: { name: 'Cincin Mutiara', slug: 'cincin-mutiara' },
      category_slug: 'cincin-mutiara',
      varietas: 'South Sea Pearl',
      grade: 'AAA',
      ukuran_mm: '12.5',
      logam: 'Emas 18K',
      berat: '5.2 gr',
      bentuk: 'Bulat Sempurna',
      price: 16500000,
      stock: 3,
      status: 'published',
      image: '/images/hero_pearl_shell.jpg',
    };

    vi.mocked(catalogApi.getProducts).mockResolvedValueOnce({ data: [singleProduct] });
    vi.mocked(catalogApi.getCategories).mockResolvedValueOnce([
      { id: 1, name: 'Cincin Mutiara', slug: 'cincin-mutiara' },
    ]);

    await act(async () => {
      root.render(
        <MemoryRouter initialEntries={['/katalog']}>
          <CatalogPage onAddToCart={() => {}} onSelectProduct={() => {}} />
        </MemoryRouter>
      );
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    const text = container.textContent || '';
    expect(text).toContain('Mahkota Mutiara Emas Lombok 18K Solid');
    expect(text).toContain('16.500.000');

    // Kartu produk berhasil dirender normal
    const productCards = container.querySelectorAll('[data-slot="product-card"]');
    expect(productCards.length).toBeGreaterThanOrEqual(1);
  });
});
