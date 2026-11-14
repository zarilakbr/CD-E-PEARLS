import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import type { MockOrder } from '../../types/models';
import { resolveMediaUrl } from '../../lib/media';
import { useCart } from '../../context/CartContext';
import { Seo } from '../../components/common/Seo';

const getItemImage = (category?: any, image?: string) => {
  if (image) return resolveMediaUrl(image);
  const cat = (typeof category === 'object' ? category?.name : (category || '')).toLowerCase();
  if (cat.includes('cincin')) return '/images/placeholder_jewelry.svg';
  if (cat.includes('gelang')) return '/images/featured_pearl_dark_luxury.jpg';
  if (cat.includes('anting')) return '/images/terroir_pearl_plate_left.jpg';
  if (cat.includes('butir') || cat.includes('lepas')) return '/images/hero_pearl_dark_luxury.jpg';
  return '/images/hero_pearl_shell.jpg';
};

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
  const {
    items: cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    insuranceCost,
  } = useCart();

  const [selectedItemIds, setSelectedItemIds] = useState<number[]>(() =>
    cartItems.map((c) => c.product.id)
  );

  // Sync selected item IDs when cart changes
  React.useEffect(() => {
    setSelectedItemIds(cartItems.map((c) => c.product.id));
  }, [cartItems.length]);

  const selectAll = selectedItemIds.length === cartItems.length && cartItems.length > 0;

  // Order status lookup box state
  const [orderLookupNumber, setOrderLookupNumber] = useState('');
  const [lookupResult, setLookupResult] = useState<MockOrder | null>(null);
  const [lookupSearched, setLookupSearched] = useState(false);

  const toggleSelectItem = (id: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(cartItems.map((c) => c.product.id));
    }
  };

  const selectedItems = cartItems.filter((it) => selectedItemIds.includes(it.product.id));
  const activeSubtotal = selectedItems.reduce(
    (acc, curr) => acc + (Number(curr.product.price) || 0) * curr.quantity,
    0
  );
  const activeInsurance = selectedItems.length > 0 ? insuranceCost : 0;
  const activeTotal = activeSubtotal + activeInsurance;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderLookupNumber) return;
    setLookupResult(null);
    setLookupSearched(true);
  };

  const handleCheckoutClick = () => {
    if (onNavigateCheckout) onNavigateCheckout();
    else navigate('/checkout');
  };

  return (
    <div className="w-full font-sans">
      <Seo
        noindex
        title="Keranjang Belanja | CD'E Pearls Lombok"
        description="Tas perhiasan mutiara belanja Anda di CD'E Pearls Lombok."
        path="/keranjang"
      />
      {/* ========================================================
          MOBILE VIEW (< lg) - MARKETPLACE STYLE (TAHAP Q7)
         ======================================================== */}
      <div data-slot="mobile-cart" className="lg:hidden w-full flex flex-col pb-28 px-3 pt-3 space-y-3 bg-[var(--bg)]">
        {/* Header Tas Belanja */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] px-1">
          <h2 className="font-serif text-lg font-bold text-[var(--text)]">
            Keranjang ({cartItems.length})
          </h2>
          {cartItems.length > 0 && (
            <button
              type="button"
              onClick={() => clearCart()}
              className="text-xs text-red-600 dark:text-red-400 font-semibold hover:underline cursor-pointer"
            >
              Hapus Semua
            </button>
          )}
        </div>

        {cartItems.length > 0 ? (
          <>
            {/* Kartu Barang Kompak */}
            <div className="space-y-2.5">
              {cartItems.map((item) => {
                const isMaxStock =
                  item.product.stock !== undefined && item.quantity >= item.product.stock;
                return (
                  <div
                    key={item.product.id}
                    className="p-2.5 sm:p-3 rounded-2xl bg-[var(--surface)] border border-[var(--border)] flex items-center gap-2 sm:gap-3 shadow-2xs"
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedItemIds.includes(item.product.id)}
                      onChange={() => toggleSelectItem(item.product.id)}
                      className="w-4 h-4 rounded text-[#8A6A2F] border-[var(--border)] focus:ring-[#8A6A2F] cursor-pointer shrink-0"
                      aria-label={`Pilih ${item.product.name}`}
                    />

                    {/* Foto 64px - 72px persegi */}
                    <div className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden bg-[var(--surface-2)] border border-[var(--border)] shrink-0">
                      <img
                        src={getItemImage(item.product.category, item.product.image)}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Info: Nama 2 baris, varian kecil, harga, stepper, hapus */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-16 sm:h-[72px]">
                      <div className="min-w-0">
                        <h3 className="font-serif text-xs font-bold text-[var(--text)] line-clamp-2 leading-tight">
                          {item.product.name}
                        </h3>
                        <p className="text-[10px] text-[var(--text-2)] truncate mt-0.5">
                          {item.product.pearlSize || item.product.pearl_size || '12 mm'} • {item.product.metal || 'Emas 18K'}
                          {item.product.stock !== undefined && (
                            <span className="ml-1 text-[#8A6A2F]">
                              (Stok: {item.product.stock})
                            </span>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[11px] sm:text-xs font-bold text-[#8A6A2F] dark:text-[#D9B877] truncate mr-1">
                          Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                        </span>

                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          {/* Stepper Kuantitas +/- */}
                          <div className="flex items-center border border-[var(--border)] rounded-lg bg-[var(--surface-2)] h-7 sm:h-8">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center text-[var(--text)] hover:opacity-80 active:scale-95 cursor-pointer touch-feedback"
                              aria-label="Kurangi jumlah"
                            >
                              <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                            <span className="w-5 sm:w-6 text-center text-xs font-bold text-[var(--text)]">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              disabled={isMaxStock}
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              title={isMaxStock ? 'Stok perhiasan maksimal telah tercapai' : 'Tambah jumlah'}
                              className="w-6 sm:w-7 h-7 sm:h-8 flex items-center justify-center text-[var(--text)] hover:opacity-80 active:scale-95 cursor-pointer touch-feedback disabled:opacity-30 disabled:cursor-not-allowed"
                              aria-label="Tambah jumlah"
                            >
                              <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </button>
                          </div>

                          {/* Tombol Hapus Tempat Sampah */}
                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id)}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer touch-feedback"
                            aria-label={`Hapus ${item.product.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Baris Ringkasan Bawah Tetap (Pilih Semua + Total + Checkout) */}
            <div className="fixed bottom-14 left-0 right-0 z-30 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] px-3.5 py-2.5 flex items-center justify-between gap-3 shadow-lg pb-safe">
              <label className="flex items-center gap-2 text-xs font-medium text-[var(--text)] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleToggleSelectAll}
                  className="w-4 h-4 rounded text-[#8A6A2F] border-[var(--border)] focus:ring-[#8A6A2F]"
                />
                <span>Semua</span>
              </label>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-2)] block leading-none">Total</span>
                  <span className="text-sm font-bold text-[#8A6A2F] dark:text-[#D9B877]">
                    Rp {activeTotal.toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  disabled={selectedItems.length === 0}
                  className="min-h-[44px] px-5 rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-bold touch-feedback cursor-pointer shadow-xs disabled:opacity-50"
                >
                  Checkout ({selectedItems.length})
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Keadaan Keranjang Kosong */
          <div className="py-16 text-center space-y-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[#8A6A2F] dark:text-[#D9B877]">
              <ShoppingBag className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h3 className="font-serif text-base font-bold text-[var(--text)]">
              Tas Belanja Masih Kosong
            </h3>
            <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto leading-relaxed">
              Jelajahi keindahan perhiasan mutiara laut selatan Lombok kami dan temukan mahakarya impian Anda.
            </p>
            <button
              type="button"
              onClick={() => navigate('/katalog')}
              className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-semibold touch-feedback shadow-xs"
            >
              Mulai Belanja
            </button>
          </div>
        )}
      </div>

      {/* ========================================================
          DESKTOP VIEW (hidden lg:block) - TERKUNCI & TETAP LENGKAP
         ======================================================== */}
      <div className="hidden lg:block w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
        {/* Title */}
        <div>
          <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] dark:text-[#D9B877] block mb-1">
            Keranjang Belanja
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-medium text-[var(--text)]">
            Tas Perhiasan Anda
          </h1>
        </div>

        {cartItems.length > 0 ? (
          <div className="grid grid-cols-12 gap-10 items-start">
            {/* Kolom Kiri: Daftar Item */}
            <div className="col-span-8 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[var(--border)]">
                <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-2)]">
                  Perhiasan Mutiara ({cartItems.length} item)
                </span>
                <button
                  type="button"
                  onClick={() => clearCart()}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer"
                >
                  Kosongkan Keranjang
                </button>
              </div>

              <div className="space-y-4">
                {cartItems.map((item) => {
                  const isMaxStock =
                    item.product.stock !== undefined && item.quantity >= item.product.stock;
                  return (
                    <div
                      key={item.product.id}
                      className="flex flex-row items-center justify-between gap-4 p-4 rounded-xl bg-[var(--surface-muted)] border border-[var(--border)]"
                    >
                      <div className="flex items-center gap-4">
                        {/* Foto Perhiasan Mewah */}
                        <div className="w-16 h-16 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] shrink-0 shadow-xs">
                          <img
                            src={getItemImage(item.product.category, item.product.image)}
                            alt={`${item.product.name} — Perhiasan Mutiara`}
                            width={64}
                            height={64}
                            loading="lazy"
                            decoding="async"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A6A2F] dark:text-[#D9B877]">
                            {typeof item.product.category === 'object' ? item.product.category?.name : (item.product.category || 'Mutiara South Sea')}
                          </span>
                          <h3 className="font-serif text-lg font-medium text-[var(--text)] leading-tight mt-0.5">
                            {item.product.name}
                          </h3>
                          <p className="text-xs text-[var(--text-2)] mt-1">
                            {item.product.pearlSize || item.product.pearl_size || '12 mm'} • {item.product.metal || 'Emas 18K'} • Grade AAA
                            {item.product.stock !== undefined && (
                              <span className="ml-2 font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                                [Stok Tersedia: {item.product.stock}]
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-6">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-[var(--border)] rounded-full bg-[var(--surface)]">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="p-1.5 hover:bg-[var(--surface-muted)] rounded-l-full text-[var(--text)] cursor-pointer"
                            aria-label="Kurangi jumlah"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="px-3 text-xs font-semibold text-[var(--text)]">{item.quantity}</span>
                          <button
                            type="button"
                            disabled={isMaxStock}
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            title={isMaxStock ? 'Stok perhiasan maksimal telah tercapai' : 'Tambah jumlah'}
                            className="p-1.5 hover:bg-[var(--surface-muted)] rounded-r-full text-[var(--text)] cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Tambah jumlah"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right">
                          <div className="font-serif text-base sm:text-lg font-semibold text-[var(--text)]">
                            Rp {(item.product.price * item.quantity).toLocaleString('id-ID')}
                          </div>
                        </div>

                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="p-1.5 text-[var(--text-2)] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 flex items-center justify-between text-xs text-[#8A6A2F] dark:text-[#D9B877]">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pengiriman dilindungi asuransi perhiasan resmi hingga tujuan.</span>
                </div>
                <button
                  type="button"
                  onClick={onNavigateCatalog || (() => navigate('/katalog'))}
                  className="font-semibold hover:underline"
                >
                  + Tambah Perhiasan Lain
                </button>
              </div>
            </div>

            {/* Kolom Kanan: Ringkasan Total & Checkout */}
            <div className="col-span-4 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
              <h3 className="font-serif text-xl font-medium text-[var(--text)] pb-3 border-b border-[var(--border)]">
                Ringkasan Pembelian
              </h3>

              <div className="space-y-3 text-xs text-[var(--text-2)]">
                <div className="flex justify-between">
                  <span>Subtotal Perhiasan</span>
                  <span className="font-semibold text-[var(--text)]">Rp {activeSubtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Asuransi Gemologi Penuh</span>
                  <span className="font-semibold text-[var(--text)]">Rp {activeInsurance.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Ongkos Kirim Domestik</span>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Gratis (Promo Atelier)</span>
                </div>

                <div className="pt-4 border-t border-[var(--border)] flex justify-between items-baseline">
                  <span className="font-serif text-base font-medium text-[var(--text)]">Total Pembayaran</span>
                  <span className="font-serif text-2xl font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                    Rp {activeTotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckoutClick}
                disabled={selectedItems.length === 0}
                className="w-full min-h-[48px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] dark:bg-[#D9B877] dark:text-[#12263A] dark:hover:bg-[#C9A968] text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all active:scale-98 disabled:opacity-50"
              >
                <span>Lanjut ke Pembayaran ({selectedItems.length})</span>
                <ArrowRight className="w-4 h-4 text-[#D9B877] dark:text-[#12263A]" />
              </button>

              <div className="pt-4 border-t border-[var(--border)] text-center">
                <span className="text-[11px] text-[var(--text-2)]">
                  Sertifikat gemologi lab &amp; kotak beludru eksklusif disertakan otomatis.
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Keadaan Kosong Desktop */
          <div className="text-center py-20 space-y-6 max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-[var(--surface-muted)] mx-auto flex items-center justify-center text-[#8A6A2F] dark:text-[#D9B877]">
              <ShoppingBag className="w-10 h-10 stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-3xl font-medium text-[var(--text)]">
              Tas Belanja Anda Kosong
            </h2>
            <p className="text-xs text-[var(--text-2)] leading-relaxed">
              Jelajahi mahakarya mutiara air laut selatan kami dari perairan Sekotong &amp; Medana, Lombok.
            </p>
            <button
              type="button"
              onClick={onNavigateCatalog || (() => navigate('/katalog'))}
              className="min-h-[44px] px-8 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] dark:bg-[#D9B877] dark:text-[#12263A] dark:hover:bg-[#C9A968] text-xs font-semibold cursor-pointer shadow-md"
            >
              Mulai Eksplorasi Koleksi
            </button>
          </div>
        )}

        {/* Lacak Pesanan Langsung */}
        <section className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] dark:text-[#D9B877] block mb-1">
              Layanan Concierge
            </span>
            <h2 className="font-serif text-2xl font-medium text-[var(--text)]">
              Lacak Pengiriman Pesanan Anda
            </h2>
            <p className="text-xs text-[var(--text-2)] mt-1">
              Masukkan ID Pesanan atau Nomor Resi pengiriman berasuransi Anda untuk memantau status secara langsung.
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 max-w-lg">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Contoh: ORD-2026-081 atau JNE-882910"
                value={orderLookupNumber}
                onChange={(e) => setOrderLookupNumber(e.target.value)}
                className="w-full min-h-[44px] pl-10 pr-4 rounded-full bg-[var(--input-bg)] border border-[var(--border)] text-xs text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)]"
              />
              <Search className="w-4 h-4 text-[var(--text-2)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto min-h-[44px] px-7 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] dark:bg-[#D9B877] dark:text-[#12263A] dark:hover:bg-[#C9A968] text-xs font-semibold cursor-pointer shrink-0"
            >
              Cek Status
            </button>
          </form>

          {lookupSearched && lookupResult && (
            <div className="pt-6 border-t border-[var(--border)] space-y-4 animate-in fade-in">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="font-mono text-xs font-bold text-[var(--text)]">{lookupResult.id}</span>
                  <h3 className="font-serif text-xl font-semibold text-[var(--text)] mt-0.5">
                    Pesanan a.n. {lookupResult.customerName}
                  </h3>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-[var(--info-bg)] border border-[var(--info-border)] text-[var(--info-text)]">
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
            <div className="p-4 rounded-xl bg-[var(--surface-muted)] text-center text-xs text-[var(--text-2)]">
              Nomor pesanan tidak ditemukan. Coba periksa kembali email konfirmasi Anda.
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default CartPage;
