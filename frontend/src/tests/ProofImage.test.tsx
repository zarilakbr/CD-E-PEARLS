import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { ProofImage, resolveProofEndpoint } from '../components/common/ProofImage';
import { apiClient } from '../lib/api';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('../lib/api', () => ({
  apiClient: {
    get: vi.fn(),
  },
}));

describe('Tahap V3c: ProofImage & useProofBlobUrl Component Tests', () => {
  let container: HTMLDivElement;
  let root: Root;
  const mockCreateObjectURL = vi.fn();
  const mockRevokeObjectURL = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    mockCreateObjectURL.mockImplementation((_blob: Blob) => `blob:http://localhost/${Math.random().toString(36).slice(2)}`);
    mockRevokeObjectURL.mockImplementation(() => {});

    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('resolveProofEndpoint utility', () => {
    it('1. Memangkas prefix /api/v1 bila src diawali /api/v1', () => {
      expect(resolveProofEndpoint({ src: '/api/v1/orders/10/payments/2/proof' })).toBe('/orders/10/payments/2/proof');
    });

    it('2. Menggunakan endpoint /orders/:orderId/payments/:paymentId/proof jika id disediakan', () => {
      expect(resolveProofEndpoint({ orderId: 44, paymentId: 7 })).toBe('/orders/44/payments/7/proof');
    });

    it('3. Mengembalikan null jika parameter kosong', () => {
      expect(resolveProofEndpoint({})).toBeNull();
    });
  });

  describe('ProofImage UI Rendering', () => {
    it('4. Sukses: memuat blob gambar, createObjectURL dipanggil, dan render <img data-testid="proof-image">', async () => {
      const mockBlob = new Blob(['fake image data'], { type: 'image/jpeg' });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockBlob,
        headers: { 'content-type': 'image/jpeg' },
      });

      await act(async () => {
        root.render(
          <ProofImage
            src="/api/v1/orders/12/payments/3/proof"
            alt="Bukti Transfer Uji"
            className="w-32 h-32"
          />
        );
      });

      // Assert apiClient.get dipanggil dengan endpoint yang bersih dari /api/v1
      expect(apiClient.get).toHaveBeenCalledWith('/orders/12/payments/3/proof', {
        responseType: 'blob',
      });

      expect(mockCreateObjectURL).toHaveBeenCalledWith(mockBlob);

      const img = container.querySelector('[data-testid="proof-image"]') as HTMLImageElement;
      expect(img).not.toBeNull();
      expect(img.src).toContain('blob:http://localhost/');
      expect(img.alt).toBe('Bukti Transfer Uji');
      expect(container.querySelector('[data-testid="proof-skeleton"]')).toBeNull();
      expect(container.querySelector('[data-testid="proof-error"]')).toBeNull();
    });

    it('5. Error 401 Unauthorized: tampilkan pesan "Bukti tidak dapat dimuat" dan tombol coba lagi', async () => {
      const error401 = new Error('Request failed with status code 401');
      (error401 as any).response = { status: 401, data: { message: 'Unauthenticated' } };
      vi.mocked(apiClient.get).mockRejectedValueOnce(error401);

      await act(async () => {
        root.render(
          <ProofImage
            orderId={100}
            paymentId={5}
            alt="Bukti Transfer 401"
          />
        );
      });

      const errorEl = container.querySelector('[data-testid="proof-error"]');
      expect(errorEl).not.toBeNull();
      expect(errorEl?.textContent).toContain('Bukti tidak dapat dimuat');

      const retryBtn = container.querySelector('[data-testid="proof-retry-btn"]') as HTMLButtonElement;
      expect(retryBtn).not.toBeNull();
      expect(retryBtn.textContent).toContain('Coba Lagi');

      // Coba klik tombol retry
      const mockBlob = new Blob(['recovered image'], { type: 'image/png' });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockBlob,
        headers: { 'content-type': 'image/png' },
      });

      await act(async () => {
        retryBtn.click();
      });

      expect(apiClient.get).toHaveBeenCalledTimes(2);
      expect(container.querySelector('[data-testid="proof-image"]')).not.toBeNull();
    });

    it('6. Error 404 Not Found: tampilkan pesan "Bukti tidak dapat dimuat" dan tombol coba lagi', async () => {
      const error404 = new Error('Request failed with status code 404');
      (error404 as any).response = { status: 404, data: { message: 'Pesanan tidak ditemukan' } };
      vi.mocked(apiClient.get).mockRejectedValueOnce(error404);

      await act(async () => {
        root.render(
          <ProofImage
            src="/orders/999/payments/888/proof"
          />
        );
      });

      const errorEl = container.querySelector('[data-testid="proof-error"]');
      expect(errorEl).not.toBeNull();
      expect(errorEl?.textContent).toContain('Bukti tidak dapat dimuat');
      expect(container.querySelector('[data-testid="proof-image"]')).toBeNull();
    });

    it('7. Revoke URL saat unmount untuk mencegah memory leak', async () => {
      const mockBlob = new Blob(['blob data'], { type: 'image/webp' });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockBlob,
        headers: { 'content-type': 'image/webp' },
      });

      await act(async () => {
        root.render(
          <ProofImage
            orderId={55}
            paymentId={11}
          />
        );
      });

      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
      const createdUrl = mockCreateObjectURL.mock.results[0].value;

      // Unmount komponen
      await act(async () => {
        root.unmount();
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(createdUrl);
    });

    it('8. Revoke URL saat sumber (src) berubah', async () => {
      const mockBlob1 = new Blob(['image 1'], { type: 'image/jpeg' });
      const mockBlob2 = new Blob(['image 2'], { type: 'image/jpeg' });

      vi.mocked(apiClient.get)
        .mockResolvedValueOnce({ data: mockBlob1, headers: { 'content-type': 'image/jpeg' } })
        .mockResolvedValueOnce({ data: mockBlob2, headers: { 'content-type': 'image/jpeg' } });

      await act(async () => {
        root.render(<ProofImage src="/orders/1/payments/1/proof" />);
      });

      const firstUrl = mockCreateObjectURL.mock.results[0].value;

      await act(async () => {
        root.render(<ProofImage src="/orders/2/payments/2/proof" />);
      });

      expect(mockRevokeObjectURL).toHaveBeenCalledWith(firstUrl);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
    });

    it('9. Berkas PDF: tampilkan tautan unduh blob alih-alih elemen <img>', async () => {
      const mockPdfBlob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
      vi.mocked(apiClient.get).mockResolvedValueOnce({
        data: mockPdfBlob,
        headers: { 'content-type': 'application/pdf' },
      });

      await act(async () => {
        root.render(
          <ProofImage
            orderId={77}
            paymentId={99}
            proofPath="payments/surat_transfer.pdf"
          />
        );
      });

      expect(container.querySelector('[data-testid="proof-image"]')).toBeNull();
      const pdfContainer = container.querySelector('[data-testid="proof-pdf"]');
      expect(pdfContainer).not.toBeNull();
      expect(pdfContainer?.textContent).toContain('Berkas Bukti Transfer (PDF)');

      const downloadLink = pdfContainer?.querySelector('a') as HTMLAnchorElement;
      expect(downloadLink).not.toBeNull();
      expect(downloadLink.download).toBe('bukti-transfer-77.pdf');
      expect(downloadLink.href).toContain('blob:http://localhost/');
      expect(downloadLink.textContent).toContain('Unduh Berkas PDF');
    });
  });
});
