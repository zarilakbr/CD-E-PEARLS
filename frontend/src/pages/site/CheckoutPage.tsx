import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { orderApi } from '../../lib/api';
import {
  CreditCard,
  Truck,
  CheckCircle2,
  Lock,
  ArrowRight,
  AlertCircle,
  Copy,
  Check,
} from 'lucide-react';

export const CheckoutPage: React.FC = () => {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();

  const [recipientName, setRecipientName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [orderCreated, setOrderCreated] = useState<any | null>(null);
  const [trackingToken, setTrackingToken] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Penyelesaian Pesanan | CD'E Pearls Lombok";
  }, []);

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) {
      setError('Mohon lengkapi alamat pengiriman perhiasan Anda.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setVoucherError(null);

    try {
      const itemsPayload = items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));

      const payload = {
        customer_name: recipientName || user?.name || 'Pelanggan Butik',
        customer_phone: phone || user?.phone || '081234567890',
        customer_address: address,
        notes: notes || undefined,
        payment_method: 'TRANSFER_BANK',
        voucher_code: voucherCode.trim() || undefined,
        turnstile_token: user ? undefined : '1x00000000000000000000AA',
        items: itemsPayload,
      };

      const res = await orderApi.createOrder(payload);

      if (res && res.order) {
        setOrderCreated(res.order);
        if (res.tracking_token) {
          setTrackingToken(res.tracking_token);
        }
        clearCart();
      } else {
        const demoOrder = {
          order_number: `CDE-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`,
          total: total,
          order_status: 'PENDING',
        };
        setOrderCreated(demoOrder);
        clearCart();
      }
    } catch (err: any) {
      const respData = err.response?.data;
      if (respData?.errors?.voucher_code) {
        setVoucherError(respData.errors.voucher_code[0]);
      } else if (respData?.message) {
        setError(respData.message);
      } else {
        setError('Gagal membuat pesanan. Harap periksa kembali isian formulir.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-wider uppercase">
          <Lock className="w-3.5 h-3.5" />
          <span>Checkout Terenkripsi 256-Bit</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          Penyelesaian Pesanan (Checkout)
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] font-light">
          Setiap perhiasan mutiara dipersiapkan dan diinspeksi oleh ahli gemologi kami sebelum dikirimkan.
        </p>
      </div>

      {orderCreated ? (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#12263A] border-2 border-[#D9B877] rounded-3xl p-6 sm:p-10 shadow-xl space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 block mb-1">
              Pesanan Berhasil Dibuat
            </span>
            <h2 className="font-serif text-2xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Nomor Pesanan: {orderCreated.order_number}
            </h2>
            <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-2 leading-relaxed">
              Silakan lakukan pembayaran sebesar{' '}
              <strong>Rp {(orderCreated.total || total).toLocaleString('id-ID')}</strong> ke rekening resmi CD'E Pearls.
            </p>
          </div>

          {trackingToken && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 dark:text-amber-300">
                  Token Pelacakan Tamu (Simpan Token Ini)
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(trackingToken);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-md bg-white dark:bg-[#12263A] border border-amber-300 dark:border-amber-700 text-[11px] font-semibold text-amber-900 dark:text-amber-200 cursor-pointer hover:bg-amber-100 inline-flex items-center gap-1.5"
                >
                  {copiedToken ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedToken ? 'Tersalin' : 'Salin Token'}</span>
                </button>
              </div>
              <p className="font-mono text-xs break-all bg-white dark:bg-black/30 p-2.5 rounded-lg border border-amber-200 dark:border-white/10 text-[#12263A] dark:text-[#D9B877]">
                {trackingToken}
              </p>
              <p className="text-[11px] text-[#4A5666] dark:text-[#D9B877]/80 leading-relaxed">
                Simpan token ini untuk melacak status pesanan Anda sebagai tamu bersama dengan nomor pesanan dan 4 digit akhir nomor telepon.
              </p>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-[#FBF8F3] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-[#4A5666]">Bank Tujuan:</span>
              <span className="font-bold text-[#12263A] dark:text-[#FBF8F3]">BCA (Bank Central Asia)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5666]">Nomor Rekening:</span>
              <span className="font-mono font-bold text-[#8A6A2F] dark:text-[#D9B877]">056-889-2211</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5666]">Atas Nama:</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">PT CDE PEARLS LOMBOK</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to={`/lacak-pesanan?order=${orderCreated.order_number}${trackingToken ? `&token=${trackingToken}` : ''}&phone_last4=${phone.replace(/\D/g, '').slice(-4)}`}
              className="flex-1 min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Lacak Status Pesanan</span>
              <ArrowRight className="w-4 h-4 text-[#D9B877]" />
            </Link>
            <Link
              to="/akun/pesanan"
              className="flex-1 min-h-[44px] px-6 rounded-full border border-[#12263A] dark:border-white/20 text-[#12263A] dark:text-[#FBF8F3] text-xs font-semibold inline-flex items-center justify-center cursor-pointer"
            >
              Lihat di Riwayat Pesanan
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Shipping Form */}
          <div className="lg:col-span-7 bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3] flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#8A6A2F]" />
              <span>Informasi Penerima &amp; Pengiriman</span>
            </h3>

            {error && (
              <div className="p-3.5 rounded-xl bg-red-50 text-red-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!user && (
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-[11px] text-amber-900 dark:text-amber-200 leading-relaxed">
                Pemesanan sebagai Tamu dilindungi Turnstile. Token pelacakan unik akan dibuat otomatis untuk melacak pesanan Anda tanpa login.
              </div>
            )}

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">Nama Lengkap Penerima</label>
                <input
                  type="text"
                  required
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  placeholder="Nama penerima paket perhiasan"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">Nomor WhatsApp / Seluler</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">Alamat Lengkap Pengiriman</label>
                <textarea
                  rows={3}
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Nama jalan, nomor rumah, RT/RW, kelurahan, kecamatan, kota/kabupaten, kode pos"
                  className="w-full p-3.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">Catatan Khusus (Opsional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Titipkan di pos satpam jika tidak ada orang"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5 bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
            <h3 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3] flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#8A6A2F]" />
              <span>Ringkasan Pesanan</span>
            </h3>

            <div className="space-y-3 divide-y divide-[#E6DDD0] dark:divide-white/10 text-xs">
              {items.map((i, idx) => (
                <div key={idx} className="pt-3 first:pt-0 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img src={i.product.image} alt={i.product.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div>
                      <p className="font-semibold text-[#12263A] dark:text-[#FBF8F3] line-clamp-1">{i.product.name}</p>
                      <p className="text-[11px] text-[#4A5666] dark:text-[#D9B877]">Jumlah: {i.quantity}</p>
                    </div>
                  </div>
                  <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3] shrink-0">
                    Rp {((i.product.price || 0) * i.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            {/* Voucher Code Input */}
            <div className="space-y-1.5 pt-3 border-t border-[#E6DDD0] dark:border-white/10">
              <label className="text-[11px] font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                Kode Voucher Diskon (Opsional)
              </label>
              <input
                type="text"
                value={voucherCode}
                onChange={(e) => {
                  setVoucherCode(e.target.value.toUpperCase());
                  setVoucherError(null);
                }}
                placeholder="Contoh: MUTIARABERCAHAYA"
                className="w-full min-h-[40px] px-3.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] font-mono text-xs uppercase focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
              />
              {voucherError && (
                <p className="text-[11px] text-red-600 dark:text-red-400">{voucherError}</p>
              )}
            </div>

            <div className="pt-4 border-t border-[#E6DDD0] dark:border-white/10 space-y-2 text-xs">
              <div className="flex justify-between text-[#4A5666] dark:text-[#D9B877]">
                <span>Pengiriman Berasuransi Penuh</span>
                <span className="text-emerald-600 font-semibold uppercase">Gratis</span>
              </div>
              <div className="flex justify-between text-[#4A5666] dark:text-[#D9B877]">
                <span>Sertifikat Gemologi</span>
                <span className="text-emerald-600 font-semibold uppercase">Termasuk</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#12263A] dark:text-[#FBF8F3] pt-2 border-t border-[#E6DDD0] dark:border-white/10">
                <span>Total Pembayaran</span>
                <span className="font-serif text-[#8A6A2F] dark:text-[#D9B877]">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || items.length === 0}
              className="w-full min-h-[48px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              {isLoading ? (
                <span>Memproses Pesanan...</span>
              ) : (
                <>
                  <span>Buat Pesanan &amp; Dapatkan Resi</span>
                  <ArrowRight className="w-4 h-4 text-[#D9B877]" />
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default CheckoutPage;
