import { describe, it, expect } from 'vitest';
import { getLatestPayment } from '../lib/paymentUtils';

describe('Tahap V3c: getLatestPayment Helper Tests', () => {
  it('1. Mengembalikan null jika input kosong, null, undefined, atau bukan array', () => {
    expect(getLatestPayment([])).toBeNull();
    expect(getLatestPayment(null)).toBeNull();
    expect(getLatestPayment(undefined)).toBeNull();
    expect(getLatestPayment('bukan array' as any)).toBeNull();
    expect(getLatestPayment({} as any)).toBeNull();
  });

  it('2. Satu item: langsung mengembalikan item tunggal tersebut', () => {
    const single = { id: 42, proof_path: 'payments/single.jpg', status: 'PENDING' };
    expect(getLatestPayment([single])).toEqual(single);
  });

  it('3. Urutan acak berdasarkan ID: memilih pembayaran dengan ID terbesar', () => {
    const p1 = { id: 3, proof_path: 'p1.jpg' };
    const p2 = { id: 88, proof_path: 'p2.jpg' };
    const p3 = { id: 14, proof_path: 'p3.jpg' };
    const p4 = { id: 2, proof_path: 'p4.jpg' };

    expect(getLatestPayment([p1, p2, p3, p4])).toEqual(p2);
    expect(getLatestPayment([p4, p3, p2, p1])).toEqual(p2);
    expect(getLatestPayment([p2, p1, p4, p3])).toEqual(p2);
  });

  it('4. Urutan acak berdasarkan timestamp created_at: memilih yang paling baru', () => {
    const pOld = {
      id: 50,
      created_at: '2026-11-09T08:00:00Z',
      proof_path: 'payments/pOld.jpg',
    };
    const pMid = {
      id: 55,
      created_at: '2026-11-09T10:00:00Z',
      proof_path: 'payments/pMid.jpg',
    };
    const pNewest = {
      id: 20, // id lebih kecil tapi created_at lebih baru
      created_at: '2026-11-09T12:00:00Z',
      proof_path: 'payments/pNewest.jpg',
    };

    expect(getLatestPayment([pOld, pNewest, pMid])).toEqual(pNewest);
    expect(getLatestPayment([pNewest, pOld, pMid])).toEqual(pNewest);
    expect(getLatestPayment([pMid, pOld, pNewest])).toEqual(pNewest);
  });

  it('5. Skenario Alur Nyata: Bukti ditolak (pembayaran 1) lalu diunggah ulang (pembayaran 2) -> memilih pembayaran 2', () => {
    const rejectedPayment = {
      id: 101,
      order_id: 15,
      status: 'REJECTED',
      proof_path: 'payments/bukti_lama_buram.jpg',
      notes: 'Foto buram dan terpotong',
      created_at: '2026-11-09T09:00:00Z',
    };

    const newUploadedPayment = {
      id: 102,
      order_id: 15,
      status: 'PENDING',
      proof_path: 'payments/bukti_baru_jelas.png',
      notes: 'Transfer m-BCA nominal pas',
      created_at: '2026-11-09T10:15:00Z',
    };

    // Saat backend mengembalikan daftar pembayaran berurutan dari lama ke baru
    const payments = [rejectedPayment, newUploadedPayment];
    const latest = getLatestPayment(payments);

    expect(latest).not.toBeNull();
    expect(latest?.id).toBe(102);
    expect(latest?.proof_path).toBe('payments/bukti_baru_jelas.png');
    expect(latest?.notes).toBe('Transfer m-BCA nominal pas');
  });
});

