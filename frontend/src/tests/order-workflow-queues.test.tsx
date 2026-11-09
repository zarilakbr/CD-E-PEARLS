import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderApi, notificationApi, voucherAdminApi, apiClient } from '../lib/api';

describe('Tahap V3b: Order Workflow, Queues & CRUD APIs', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Order State Machine & Queue APIs', () => {
    it('1. Admin verifyPayment mengirim POST ke /admin/orders/:id/verify-payment dengan catatan', async () => {
      const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { message: 'Pembayaran pesanan berhasil diverifikasi.' },
      } as any);

      const res = await orderApi.verifyPayment(123, 'Mutasi BCA masuk');
      expect(spy).toHaveBeenCalledWith('/admin/orders/123/verify-payment', {
        notes: 'Mutasi BCA masuk',
      });
      expect(res.message).toContain('berhasil diverifikasi');
    });

    it('2. Admin rejectPayment mengirim POST ke /admin/orders/:id/reject-payment dengan alasan', async () => {
      const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { message: 'Pembayaran pesanan ditolak.' },
      } as any);

      const res = await orderApi.rejectPayment(123, 'Bukti buram tidak terbaca');
      expect(spy).toHaveBeenCalledWith('/admin/orders/123/reject-payment', {
        reason: 'Bukti buram tidak terbaca',
      });
      expect(res.message).toContain('ditolak');
    });

    it('3. SPI spiProcessOrder mengirim POST ke /spi/orders/:id/process', async () => {
      const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { message: 'Pesanan mulai diproses di atelier.' },
      } as any);

      const res = await orderApi.spiProcessOrder(456, 'Pengemasan beludru');
      expect(spy).toHaveBeenCalledWith('/spi/orders/456/process', {
        notes: 'Pengemasan beludru',
      });
      expect(res.message).toContain('mulai diproses');
    });

    it('4. SPI spiShipOrder mengirim POST ke /spi/orders/:id/ship dengan resi dan kurir', async () => {
      const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { message: 'Pesanan telah diserahkan ke kurir pengiriman.' },
      } as any);

      const res = await orderApi.spiShipOrder(456, 'JNE-REG-99182', 'JNE Express', 'Asuransi penuh');
      expect(spy).toHaveBeenCalledWith('/spi/orders/456/ship', {
        tracking_number: 'JNE-REG-99182',
        courier: 'JNE Express',
        notes: 'Asuransi penuh',
      });
      expect(res.message).toContain('diserahkan ke kurir');
    });

    it('5. SPI spiCompleteOrder mengirim POST ke /spi/orders/:id/complete', async () => {
      const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { message: 'Pesanan telah selesai.' },
      } as any);

      const res = await orderApi.spiCompleteOrder(456);
      expect(spy).toHaveBeenCalledWith('/spi/orders/456/complete', {
        notes: undefined,
      });
      expect(res.message).toContain('selesai');
    });
  });

  describe('Customer Notifications CRUD APIs', () => {
    it('6. notificationApi.deleteNotification mengirim DELETE ke /notifications/:id', async () => {
      const spy = vi.spyOn(apiClient, 'delete').mockResolvedValue({
        data: { message: 'Notifikasi berhasil dihapus.' },
      } as any);

      const res = await notificationApi.deleteNotification(789);
      expect(spy).toHaveBeenCalledWith('/notifications/789');
      expect(res.message).toContain('berhasil dihapus');
    });

    it('7. notificationApi.clearNotifications mengirim DELETE ke /notifications', async () => {
      const spy = vi.spyOn(apiClient, 'delete').mockResolvedValue({
        data: { message: 'Semua notifikasi berhasil dibersihkan.' },
      } as any);

      const res = await notificationApi.clearNotifications();
      expect(spy).toHaveBeenCalledWith('/notifications');
      expect(res.message).toContain('berhasil dibersihkan');
    });
  });

  describe('Admin Voucher CRUD APIs', () => {
    it('8. voucherAdminApi.getVouchers mengirim GET ke /admin/vouchers', async () => {
      const mockList = [{ id: 1, code: 'CDE10', value: 10, type: 'percent' }];
      const spy = vi.spyOn(apiClient, 'get').mockResolvedValue({
        data: mockList,
      } as any);

      const res = await voucherAdminApi.getVouchers();
      expect(spy).toHaveBeenCalledWith('/admin/vouchers', { params: undefined });
      expect(res).toEqual(mockList);
    });

    it('9. voucherAdminApi.createVoucher mengirim POST ke /admin/vouchers', async () => {
      const payload = {
        code: 'KEMILAU50',
        type: 'fixed' as const,
        value: 50000,
        min_spend: 500000,
      };
      const spy = vi.spyOn(apiClient, 'post').mockResolvedValue({
        data: { message: 'Voucher berhasil dibuat.', data: { id: 2, ...payload } },
      } as any);

      const res = await voucherAdminApi.createVoucher(payload);
      expect(spy).toHaveBeenCalledWith('/admin/vouchers', payload);
      expect(res.message).toContain('berhasil dibuat');
    });

    it('10. voucherAdminApi.deleteVoucher mengirim DELETE ke /admin/vouchers/:id', async () => {
      const spy = vi.spyOn(apiClient, 'delete').mockResolvedValue({
        data: { message: 'Voucher berhasil dihapus.' },
      } as any);

      const res = await voucherAdminApi.deleteVoucher(2);
      expect(spy).toHaveBeenCalledWith('/admin/vouchers/2');
      expect(res.message).toContain('berhasil dihapus');
    });
  });
});
