import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Truck, Search, AlertCircle, Key, Phone, Hash } from 'lucide-react';
import { orderApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { Seo } from '../../components/common/Seo';

export const OrderTrackingPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialOrder = searchParams.get('order') || searchParams.get('resi') || '';
  const initialToken = searchParams.get('token') || '';
  const initialPhone4 = searchParams.get('phone_last4') || '';

  const { user } = useAuth();
  const [lang, setLang] = useState<'id' | 'en'>('id');
  const [orderNumber, setOrderNumber] = useState(initialOrder);
  const [trackingToken, setTrackingToken] = useState(initialToken);
  const [phoneLast4, setPhoneLast4] = useState(initialPhone4);
  const [isLoading, setIsLoading] = useState(false);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrder && (user || (initialToken && initialPhone4))) {
      handleTrack(initialOrder, initialToken, initialPhone4);
    }
  }, [initialOrder, initialToken, initialPhone4, user]);

  const handleTrack = async (orderNum: string, tokenVal?: string, phoneVal?: string) => {
    const trimmedNum = orderNum.trim();
    if (!trimmedNum) return;

    setIsLoading(true);
    setError(null);
    setOrderData(null);

    try {
      const data = await orderApi.track(trimmedNum, tokenVal?.trim(), phoneVal?.trim());
      if (data) {
        setOrderData(data);
      } else {
        setError(lang === 'id'
          ? 'Pesanan tidak ditemukan atau otorisasi tidak valid.'
          : 'Order not found or invalid authorization.');
      }
    } catch {
      setError(lang === 'id'
        ? 'Pesanan tidak ditemukan atau otorisasi tidak valid. Periksa nomor pesanan, token, dan 4 digit telepon.'
        : 'Order not found or invalid authorization. Please check order number, tracking token, and 4-digit phone.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleTrack(orderNumber, trackingToken, phoneLast4);
  };

  const t = {
    id: {
      badge: 'Pelacakan Ekspedisi Berasuransi',
      title: 'Lacak Pesanan Mutiara',
      desc: 'Masukkan nomor pesanan, token pelacakan tamu, dan 4 digit akhir nomor telepon Anda.',
      orderNum: 'Nomor Pesanan',
      orderPlaceholder: 'Contoh: CDE-2026-0001',
      tokenLabel: 'Token Pelacakan Tamu (64 Karakter)',
      tokenPlaceholder: 'Masukkan token dari invoice/konfirmasi',
      phoneLabel: '4 Digit Akhir Nomor Telepon',
      phonePlaceholder: 'Contoh: 7890',
      btnTrack: 'Lacak Status',
      btnLoading: 'Melacak...',
      statusTitle: 'Status Pesanan',
      customerMasked: 'Nama Pemesan',
      phoneMasked: 'Telepon',
      cityLabel: 'Kota Tujuan',
      courierLabel: 'Kurir / Resi',
      totalLabel: 'Total Nilai',
      subtotalLabel: 'Subtotal Produk',
      discountLabel: 'Diskon Voucher',
      shippingLabel: 'Ongkos Kirim & Asuransi',
      itemsTitle: 'Rincian Perhiasan',
      protectionTitle: 'Proteksi Pengiriman Gemologi',
      protectionDesc: 'Berasuransi penuh 100%. Kemasan disegel ganda dan diperiksa ahli gemologi sebelum pengiriman.',
    },
    en: {
      badge: 'Insured Shipping Tracking',
      title: 'Track Pearl Order',
      desc: 'Enter your order number, guest tracking token, and last 4 digits of your phone number.',
      orderNum: 'Order Number',
      orderPlaceholder: 'e.g. CDE-2026-0001',
      tokenLabel: 'Guest Tracking Token (64 Chars)',
      tokenPlaceholder: 'Enter token from confirmation screen',
      phoneLabel: 'Last 4 Digits of Phone',
      phonePlaceholder: 'e.g. 7890',
      btnTrack: 'Track Status',
      btnLoading: 'Tracking...',
      statusTitle: 'Order Status',
      customerMasked: 'Customer Name',
      phoneMasked: 'Phone',
      cityLabel: 'Destination City',
      courierLabel: 'Courier / Tracking #',
      totalLabel: 'Total Value',
      subtotalLabel: 'Product Subtotal',
      discountLabel: 'Voucher Discount',
      shippingLabel: 'Shipping & Insurance',
      itemsTitle: 'Jewelry Items',
      protectionTitle: 'Gemological Shipping Protection',
      protectionDesc: '100% fully insured. Double-sealed packaging inspected by our gemologists before dispatch.',
    },
  }[lang];

  return (
    <div className="w-full max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
      <Seo
        noindex
        title={lang === 'id' ? "Lacak Pesanan | CD'E Pearls Lombok" : "Track Order | CD'E Pearls Lombok"}
        description="Lacak status pengiriman pesanan perhiasan mutiara CD'E Pearls Lombok."
        path="/lacak-pesanan"
      />
      {/* Header with Language Switcher */}
      <div className="flex justify-end">
        <div className="inline-flex rounded-full p-1 bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => setLang('id')}
            className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
              lang === 'id' ? 'bg-[#12263A] text-[#D9B877] shadow-xs' : 'text-[#4A5666] dark:text-white/60'
            }`}
          >
            ID
          </button>
          <button
            type="button"
            onClick={() => setLang('en')}
            className={`px-3 py-1 rounded-full cursor-pointer transition-all ${
              lang === 'en' ? 'bg-[#12263A] text-[#D9B877] shadow-xs' : 'text-[#4A5666] dark:text-white/60'
            }`}
          >
            EN
          </button>
        </div>
      </div>

      <div className="text-center max-w-xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-wider uppercase">
          <Truck className="w-3.5 h-3.5" />
          <span>{t.badge}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          {t.title}
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] font-light">
          {t.desc}
        </p>
      </div>

      {/* Lookup Form */}
      <div className="max-w-xl mx-auto bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="space-y-1">
            <label className="font-semibold text-[#12263A] dark:text-[#FBF8F3] flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#8A6A2F]" />
              <span>{t.orderNum}</span>
            </label>
            <input
              type="text"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              placeholder={t.orderPlaceholder}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] font-mono text-xs uppercase focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
            />
          </div>

          {!user && (
            <>
              <div className="space-y-1">
                <label className="font-semibold text-[#12263A] dark:text-[#FBF8F3] flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-[#8A6A2F]" />
                  <span>{t.tokenLabel}</span>
                </label>
                <input
                  type="text"
                  required
                  value={trackingToken}
                  onChange={(e) => setTrackingToken(e.target.value.trim())}
                  placeholder={t.tokenPlaceholder}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-[#12263A] dark:text-[#FBF8F3] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#8A6A2F]" />
                  <span>{t.phoneLabel}</span>
                </label>
                <input
                  type="text"
                  maxLength={4}
                  required
                  value={phoneLast4}
                  onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={t.phonePlaceholder}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading || !orderNumber.trim()}
            className="w-full min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <Search className="w-4 h-4 text-[#D9B877]" />
            <span>{isLoading ? t.btnLoading : t.btnTrack}</span>
          </button>
        </form>
      </div>

      {/* Error Notice */}
      {error && (
        <div
          role="alert"
          className="max-w-xl mx-auto p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-800 dark:text-red-300 text-xs flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">{error}</div>
        </div>
      )}

      {/* Order Result Card */}
      {orderData && (
        <div className="max-w-2xl mx-auto bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-6 sm:p-8 shadow-lg space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#E6DDD0] dark:border-white/10 gap-2">
            <div>
              <span className="text-[11px] text-[#4A5666] dark:text-[#D9B877] block">{t.orderNum}</span>
              <h3 className="font-mono text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
                {orderData.order_number}
              </h3>
            </div>
            <div className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#12263A] text-[#D9B877]">
              {orderData.order_status} ({orderData.payment_status})
            </div>
          </div>

          {/* Masked Privacy Fields */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-[#FBF8F3] dark:bg-white/5 p-4 rounded-2xl border border-[#E6DDD0] dark:border-white/10">
            <div>
              <span className="text-[10px] text-[#4A5666] dark:text-[#D9B877] block">{t.customerMasked}</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                {orderData.customer_name_masked || orderData.customer_name || '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#4A5666] dark:text-[#D9B877] block">{t.phoneMasked}</span>
              <span className="font-mono text-[#12263A] dark:text-[#FBF8F3]">
                {orderData.customer_phone_masked || orderData.customer_phone || '-'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-[#4A5666] dark:text-[#D9B877] block">{t.cityLabel}</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                {orderData.city || orderData.customer_address || 'Lombok'}
              </span>
            </div>
          </div>

          {/* Items */}
          {orderData.items && orderData.items.length > 0 && (
            <div className="space-y-2 text-xs">
              <h4 className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">{t.itemsTitle}</h4>
              <div className="divide-y divide-[#E6DDD0] dark:divide-white/10 border border-[#E6DDD0] dark:border-white/10 rounded-xl p-3">
                {orderData.items.map((it: any, idx: number) => (
                  <div key={idx} className="py-2 first:pt-0 last:pb-0 flex justify-between">
                    <div>
                      <span className="font-medium text-[#12263A] dark:text-[#FBF8F3]">{it.product_name}</span>
                      <span className="text-[#4A5666] text-[11px] block">x{it.quantity}</span>
                    </div>
                    <span className="font-mono font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                      Rp {(it.subtotal || it.price * it.quantity || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="pt-2 border-t border-[#E6DDD0] dark:border-white/10 text-xs space-y-1.5">
            <div className="flex justify-between text-[#4A5666] dark:text-[#D9B877]">
              <span>{t.subtotalLabel}</span>
              <span className="font-mono">Rp {(orderData.subtotal || 0).toLocaleString('id-ID')}</span>
            </div>
            {orderData.discount > 0 && (
              <div className="flex justify-between text-emerald-600 font-semibold">
                <span>{t.discountLabel}</span>
                <span className="font-mono">- Rp {(orderData.discount || 0).toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-[#12263A] dark:text-[#FBF8F3] pt-2 border-t border-[#E6DDD0] dark:border-white/10">
              <span>{t.totalLabel}</span>
              <span className="font-serif text-[#8A6A2F] dark:text-[#D9B877]">
                Rp {(orderData.total || 0).toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderTrackingPage;
