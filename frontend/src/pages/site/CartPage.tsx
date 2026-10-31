import React, { useState } from 'react';
import {
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  Search,
  ShoppingBag,
} from 'lucide-react';
import { Stepper } from '../../components/common/Stepper';
import { mockOrders, type MockOrder } from '../../data/mock';

interface CartItem {
  id: number;
  name: string;
  category: string;
  pearlSize: string;
  metal: string;
  price: number;
  quantity: number;
}

const getItemImage = (category: string) => {
  const cat = category.toLowerCase();
  if (cat.includes('cincin')) return '/images/cat_ring_silk.jpg';
  if (cat.includes('gelang')) return '/images/featured_pearl_dark_luxury.jpg';
  if (cat.includes('anting')) return '/images/terroir_pearl_plate_left.jpg';
  if (cat.includes('butir') || cat.includes('lepas')) return '/images/hero_pearl_dark_luxury.jpg';
  return '/images/hero_pearl_shell.jpg';
};

import { useNavigate } from 'react-router-dom';

interface CartPageProps {
  onNavigateHome?: () => void;
  onNavigateCatalog?: () => void;
  onNavigateCheckout?: () => void;
  onNavigate?: (tab: string) => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  onNavigateHome: _onNavigateHome,
  onNavigateCatalog,
  onNavigateCheckout,
  onNavigate: _onNavigate,
}) => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([
    {
      id: 1,
      name: 'Kalung Mutiara South Sea Princess AAA',
      category: 'Kalung Mutiara',
      pearlSize: '11-12 mm',
      metal: 'Emas 18K',
      price: 18500000,
      quantity: 1,
    },
    {
      id: 3,
      name: 'Anting Stud Mutiara Putih Lombok AAA',
      category: 'Anting Mutiara',
      pearlSize: '9-10 mm',
      metal: 'Emas 18K',
      price: 7800000,
      quantity: 1,
    },
  ]);

  // Order status lookup box state
  const [orderLookupNumber, setOrderLookupNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<MockOrder | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);

  const updateQuantity = (id: number, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((it) => (it.id === id ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it))
        .filter((it) => it.quantity > 0)
    );
  };

  const removeItem = (id: number) => {
    setCartItems((prev) => prev.filter((it) => it.id !== id));
  };

  const subtotal = cartItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const insuranceCost = cartItems.length > 0 ? 50000 : 0;
  const shippingCost = 0; // Gratis kirim se-Indonesia
  const total = subtotal + insuranceCost + shippingCost;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderLookupNumber) return;
    const found = mockOrders.find(
      (o) =>
        o.id.toLowerCase().includes(orderLookupNumber.toLowerCase()) ||
        o.trackingNumber?.toLowerCase().includes(orderLookupNumber.toLowerCase())
    );
    setLookupResult(found || null);
    setLookupSearched(true);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      {/* Title */}
      <div>
        <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] block mb-1">
          Keranjang Belanja
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[#12263A]">
          Tas Perhiasan Anda
        </h1>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Kolom Kiri: Daftar Item */}
          <div className="lg:col-span-8 bg-white border border-[#E6DDD0] rounded-2xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E6DDD0]">
              <span className="text-xs uppercase tracking-wider font-semibold text-[#4A5666]">
                Perhiasan Mutiara ({cartItems.length} item)
              </span>
              <button
                type="button"
                onClick={() => setCartItems([])}
                className="text-xs text-red-600 hover:underline cursor-pointer"
              >
                Kosongkan Keranjang
              </button>
            </div>

            <div className="space-y-4">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0]"
                >
                  <div className="flex items-center gap-4">
                    {/* Foto Perhiasan Mewah */}
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-[#E6DDD0] bg-[#12263A] shrink-0 shadow-xs">
                      <img
                        src={getItemImage(item.category)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A6A2F]">
                        {item.category}
                      </span>
                      <h3 className="font-serif text-lg font-medium text-[#12263A] leading-tight mt-0.5">
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#4A5666] mt-1">
                        {item.pearlSize} • {item.metal} • Grade AAA
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E6DDD0]">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-[#E6DDD0] rounded-full bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1.5 hover:bg-[#EDE6DA] rounded-l-full text-[#12263A] cursor-pointer"
                        aria-label="Kurangi jumlah"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-3 text-xs font-semibold text-[#12263A]">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1.5 hover:bg-[#EDE6DA] rounded-r-full text-[#12263A] cursor-pointer"
                        aria-label="Tambah jumlah"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <div className="font-serif text-base sm:text-lg font-semibold text-[#12263A]">
                        Rp {(item.price * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-[#4A5666] hover:text-red-600 cursor-pointer"
                      title="Hapus"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex items-center justify-between text-xs text-[#8A6A2F]">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4" />
                <span>Pengiriman dilindungi asuransi perhiasan resmi hingga tujuan.</span>
              </div>
              <button
                type="button"
                onClick={onNavigateCatalog}
                className="font-semibold hover:underline"
              >
                + Tambah Perhiasan Lain
              </button>
            </div>
          </div>

          {/* Kolom Kanan: Ringkasan Total & Checkout */}
          <div className="lg:col-span-4 bg-white border border-[#E6DDD0] rounded-2xl p-6 sm:p-8 space-y-6">
            <h2 className="font-serif text-xl font-semibold text-[#12263A] pb-3 border-b border-[#E6DDD0]">
              Ringkasan Pesanan
            </h2>

            <div className="space-y-3 text-xs text-[#4A5666]">
              <div className="flex justify-between">
                <span>Subtotal ({cartItems.length} item)</span>
                <span className="font-medium text-[#12263A]">Rp {subtotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>Ongkos Kirim (Bebas Ongkir)</span>
                <span className="text-[#2B6330] font-semibold">GRATIS</span>
              </div>
              <div className="flex justify-between">
                <span>Premi Asuransi Kerusakan/Hilang</span>
                <span className="text-[#12263A]">Rp {insuranceCost.toLocaleString('id-ID')}</span>
              </div>
              <div className="pt-4 border-t border-[#E6DDD0] flex justify-between items-center text-sm font-bold text-[#12263A]">
                <span>Total Tagihan:</span>
                <span className="font-serif text-2xl font-bold text-[#12263A]">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Tombol Checkout */}
            <button
              type="button"
              onClick={() => onNavigateCheckout ? onNavigateCheckout() : navigate('/checkout')}
              className="w-full min-h-[48px] rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <span>Lanjut ke Pembayaran (Checkout)</span>
              <ArrowRight className="w-4 h-4 text-[#D9B877]" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-[#E6DDD0] rounded-3xl p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] mx-auto mb-4 flex items-center justify-center text-[#8A6A2F]">
            <ShoppingBag className="w-9 h-9 stroke-[1.5]" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-[#12263A]">
            Keranjang belanja Anda kosong
          </h3>
          <p className="text-xs text-[#4A5666] mt-2 mb-6">
            Temukan kilau murni mutiara air laut selatan pilihan Anda di katalog perhiasan kami.
          </p>
          <button
            type="button"
            onClick={onNavigateCatalog}
            className="min-h-[44px] px-8 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] cursor-pointer"
          >
            Lihat Koleksi Produk
          </button>
        </div>
      )}

      {/* ========================================================
          KOTAK STATUS ORDER
          Untuk melacak pesanan lewat nomor pesanan
         ======================================================== */}
      <section className="bg-white border border-[#E6DDD0] rounded-2xl p-6 sm:p-8 space-y-6">
        <div>
          <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] block mb-1">
            Lacak Pesanan Mandiri
          </span>
          <h2 className="font-serif text-2xl font-semibold text-[#12263A]">
            Cek Status Order &amp; Resi Pengiriman
          </h2>
          <p className="text-xs text-[#4A5666] mt-1">
            Sudah memesan sebelumnya? Masukkan nomor pesanan Anda (misal: #[ORD-2026-081]) untuk mengecek posisi paket.
          </p>
        </div>

        <form onSubmit={handleLookup} className="flex flex-col sm:flex-row items-center gap-3 max-w-xl">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              placeholder="Contoh: #[ORD-2026-081]"
              value={orderLookupNumber}
              onChange={(e) => setOrderLookupNumber(e.target.value)}
              className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-[#12263A] focus:outline-none focus:border-[#12263A]"
            />
            <Search className="w-4 h-4 text-[#4A5666] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto min-h-[44px] px-7 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] text-xs font-semibold cursor-pointer shrink-0"
          >
            Cek Status
          </button>
        </form>

        {lookupSearched && lookupResult && (
          <div className="pt-6 border-t border-[#E6DDD0] space-y-4 animate-in fade-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="font-mono text-xs font-bold text-[#12263A]">{lookupResult.id}</span>
                <h3 className="font-serif text-xl font-semibold text-[#12263A] mt-0.5">
                  Pesanan a.n. {lookupResult.customerName}
                </h3>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[#E1ECF7] text-[#1D4E7A]">
                {lookupResult.status}
              </span>
            </div>

            <Stepper
              steps={[
                { label: 'Dibayar', statusText: 'Selesai', date: '28 Okt, 15:00', completed: true },
                { label: 'Dikemas', statusText: 'Selesai', date: '28 Okt, 16:30', completed: true },
                { label: 'Dikirim', statusText: 'Sedang berjalan', date: '29 Okt, 09:15', completed: true, current: true },
                { label: 'Diterima', statusText: 'Menunggu', date: 'Estimasi 30 Okt', completed: false },
              ]}
              trackingNumber={lookupResult.trackingNumber}
              courier={lookupResult.courier}
            />
          </div>
        )}

        {lookupSearched && !lookupResult && (
          <div className="p-4 rounded-xl bg-[#F4F1EB] text-center text-xs text-[#4A5666]">
            Nomor pesanan tidak ditemukan. Coba periksa kembali email konfirmasi Anda.
          </div>
        )}
      </section>
    </div>
  );
};
