import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ProductDetailModal } from '../components/product/ProductDetailModal';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import type { MockProduct } from '../types/models';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('Tahap V4: Product Specifications & Certificate Display', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  const sampleProduct: MockProduct = {
    id: 1,
    code: 'PRD-LMB-KLG-001',
    name: 'Kalung Mutiara South Sea Emas 18K',
    category: 'Kalung Mutiara',
    categorySlug: 'kalung-mutiara',
    variety: 'South Sea Asli',
    varietas: 'South Sea Asli',
    grade: 'AAA Istimewa',
    pearlSize: '11.2 - 12.0 mm',
    ukuran_mm: '11.2 - 12.0 mm',
    jumlah: '1 untai / 45 butir',
    metal: 'Emas 18K',
    weight: '45.2 gr',
    berat: '45.2 gr',
    price: 25000000,
    formattedPrice: 'Rp 25.000.000',
    stock: 2,
    status: 'Aktif',
    description: 'Kalung mutiara air laut dengan kilau nacre tebal.',
    certificateNo: 'CERT-LGI-2026-9911',
    certificate_number: 'CERT-LGI-2026-9911',
    certificate_pdf_url: '/storage/certificates/cert_sample.pdf',
    image: '/images/hero_pearl_shell.jpg',
  };

  it('hanya menampilkan baris spesifikasi yang ada isinya (termasuk No, Jenis, Ukuran rentang, Grade, Jumlah, Berat, Harga)', async () => {
    await act(async () => {
      root.render(
        <AuthProvider>
          <CartProvider>
            <ProductDetailModal
              product={sampleProduct}
              isOpen={true}
              onClose={vi.fn()}
              onAddToCart={vi.fn()}
            />
          </CartProvider>
        </AuthProvider>
      );
    });

    const text = container.textContent || '';
    expect(text).toContain('No');
    expect(text).toContain('PRD-LMB-KLG-001');

    expect(text).toContain('Jenis (Species)');
    expect(text).toContain('South Sea Asli');

    expect(text).toContain('Ukuran (Size)');
    expect(text).toContain('11.2 - 12.0 mm');

    expect(text).toContain('Grade');
    expect(text).toContain('AAA Istimewa');

    expect(text).toContain('Jumlah (Quantity)');
    expect(text).toContain('1 untai / 45 butir');

    expect(text).toContain('Berat (Weight)');
    expect(text).toContain('45.2 gr');

    expect(text).toContain('Harga');
    expect(text).toContain('Rp 25.000.000');
  });

  it('menyembunyikan baris spesifikasi jika nilainya kosong dan tidak memunculkan default palsu', async () => {
    const minimalProduct: MockProduct = {
      id: 2,
      name: 'Cincin Mutiara Minimalis',
      category: 'Cincin',
      categorySlug: 'cincin-mutiara',
      variety: '',
      grade: '',
      pearlSize: '',
      metal: 'Perak 925',
      weight: '',
      price: 5000000,
      formattedPrice: 'Rp 5.000.000',
      stock: 5,
      status: 'Aktif',
      description: 'Cincin simpel elegan.',
    };

    await act(async () => {
      root.render(
        <AuthProvider>
          <CartProvider>
            <ProductDetailModal
              product={minimalProduct}
              isOpen={true}
              onClose={vi.fn()}
              onAddToCart={vi.fn()}
            />
          </CartProvider>
        </AuthProvider>
      );
    });

    const text = container.textContent || '';
    expect(text).not.toContain('No');
    expect(text).not.toContain('Jenis (Species)');
    expect(text).not.toContain('Ukuran (Size)');
    expect(text).not.toContain('Grade');
    expect(text).not.toContain('Jumlah (Quantity)');
    expect(text).not.toContain('Berat (Weight)');

    // Harga tetap tampil karena terisi
    expect(text).toContain('Harga');
    expect(text).toContain('Rp 5.000.000');
  });

  it('menampilkan Sertifikat Resmi dan tombol Lihat Sertifikat jika sertifikat terlampir', async () => {
    await act(async () => {
      root.render(
        <AuthProvider>
          <CartProvider>
            <ProductDetailModal
              product={sampleProduct}
              isOpen={true}
              onClose={vi.fn()}
              onAddToCart={vi.fn()}
            />
          </CartProvider>
        </AuthProvider>
      );
    });

    const text = container.textContent || '';
    expect(text).toContain('Sertifikat Resmi:');
    expect(text).toContain('CERT-LGI-2026-9911');
    expect(text).toContain('Lihat Sertifikat');

    const certLink = container.querySelector('a[href*="/storage/certificates/cert_sample.pdf"]');
    expect(certLink).not.toBeNull();
    expect(certLink?.getAttribute('target')).toBe('_blank');
  });

  it('tidak menampilkan badge sertifikat palsu jika sertifikat kosong', async () => {
    const noCertProduct: MockProduct = {
      id: 3,
      name: 'Anting Mutiara Kasual',
      category: 'Anting',
      categorySlug: 'anting-mutiara',
      variety: 'Freshwater',
      grade: 'AA',
      pearlSize: '9 mm',
      metal: 'Perak 925',
      weight: '3 gr',
      price: 1500000,
      formattedPrice: 'Rp 1.500.000',
      stock: 4,
      status: 'Aktif',
      description: 'Anting mutiara kasual.',
      certificateNo: '',
      certificate_number: '',
    };

    await act(async () => {
      root.render(
        <AuthProvider>
          <CartProvider>
            <ProductDetailModal
              product={noCertProduct}
              isOpen={true}
              onClose={vi.fn()}
              onAddToCart={vi.fn()}
            />
          </CartProvider>
        </AuthProvider>
      );
    });

    const text = container.textContent || '';
    expect(text).not.toContain('LAB-LMB-8921');
    expect(text).not.toContain('Sertifikat Resmi:');
    expect(text).not.toContain('Lihat Sertifikat');
  });
});
