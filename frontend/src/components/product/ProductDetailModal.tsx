import React from 'react';
import { X, Award, ShoppingBag, MessageCircle, ShieldCheck, Sparkles, ExternalLink } from 'lucide-react';
import type { MockProduct } from '../../types/models';
import { resolveMediaUrl, resolveWebpUrl } from '../../lib/media';
import { useCart } from '../../context/CartContext';

interface ProductDetailModalProps {
  product: MockProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (name: string) => void;
}

const getSmartImageFallback = (item: MockProduct) => {
  if (item.image && !item.image.includes('placeholder')) return resolveMediaUrl(item.image);
  const cat = (item.category || '').toLowerCase();
  if (cat.includes('cincin')) return '/images/placeholder_jewelry.svg';
  if (cat.includes('gelang')) return '/images/featured_pearl_dark_luxury.jpg';
  if (cat.includes('anting')) return '/images/terroir_pearl_plate_left.jpg';
  if (cat.includes('butir')) return '/images/hero_pearl_dark_luxury.jpg';
  return '/images/hero_pearl_shell.jpg';
};

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  const { addToCart } = useCart();
  if (!isOpen || !product) return null;

  const categoryName = typeof product.category === 'object' && product.category
    ? (product.category as { name?: string }).name || 'Mutiara Lombok'
    : product.category || 'Mutiara Lombok';

  const species = product.varietas || product.variety;
  const size = product.ukuran_mm || product.pearlSize;
  const weight = product.berat || product.weight;
  const formattedPrice = product.formattedPrice || (product.price ? `Rp ${Number(product.price).toLocaleString('id-ID')}` : '');

  // 7 Spesifikasi Produk CD'E Pearls - HANYA tampilkan baris yang ada isinya
  const specs = [
    { label: 'No', value: product.code },
    { label: 'Jenis (Species)', value: species },
    { label: 'Ukuran (Size)', value: size },
    { label: 'Grade', value: product.grade },
    { label: 'Jumlah (Quantity)', value: product.jumlah },
    { label: 'Berat (Weight)', value: weight },
    { label: 'Harga', value: formattedPrice },
  ].filter((item) => item.value !== undefined && item.value !== null && String(item.value).trim() !== '');

  const certNumber = product.certificate_number || product.certificateNo || product.certificate?.nomor;
  const certUrl = product.certificate_pdf_url || product.certificate?.pdf_path;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-[var(--surface)] text-[var(--text)] border border-[var(--border)] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[92dvh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 min-h-[40px] min-w-[40px] rounded-full bg-[var(--surface)]/90 border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors cursor-pointer shadow-xs"
          aria-label="Tutup jendela"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gambar Produk Kiri */}
        <div className="w-full md:w-1/2 h-[260px] sm:h-[300px] md:h-auto min-h-[260px] md:min-h-[340px] bg-[#12263A] relative shrink-0 overflow-hidden group">
          <picture className="w-full h-full block">
            <source
              type="image/webp"
              srcSet={resolveWebpUrl(getSmartImageFallback(product))}
            />
            <img
              src={getSmartImageFallback(product)}
              alt={`Detail perhiasan ${product.name} — ${categoryName}`}
              width={500}
              height={500}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/images/hero_pearl_shell.jpg';
              }}
            />
          </picture>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[#12263A]/85 backdrop-blur-md text-[#D9B877] border border-[#D9B877]/30 shadow-md">
              <ShieldCheck className="w-3.5 h-3.5 text-[#D9B877]" />
              Sertifikat lab gemologi
            </span>
            {(!product.image || product.image.includes('placeholder')) && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-black/60 text-white/90 backdrop-blur-xs w-fit">
                Foto ilustrasi
              </span>
            )}
          </div>

          <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between text-white/90 text-[11px] font-medium backdrop-blur-md bg-black/40 px-3 py-2 rounded-xl border border-white/10">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D9B877]" />
              Sekotong &amp; Medana, Lombok
            </span>
            <span className="text-[#D9B877] font-semibold">100% Pinctada maxima</span>
          </div>
        </div>

        {/* Detail Produk Kanan */}
        <div className="w-full md:w-1/2 p-5 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                {categoryName}
              </span>
              {species && (
                <>
                  <span className="text-gray-300 dark:text-gray-600">•</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)]">
                    {species}
                  </span>
                </>
              )}
            </div>

            <h2 className="font-serif text-xl sm:text-2xl md:text-3xl font-medium text-[var(--text)] leading-tight">
              {product.name}
            </h2>

            {formattedPrice && (
              <div className="mt-2 font-serif text-xl sm:text-2xl font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                {formattedPrice}
              </div>
            )}

            {/* Grid 7 Spesifikasi Produk - Hanya Tampilkan Baris yang Terisi */}
            {specs.length > 0 && (
              <div className="mt-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] p-3 text-xs divide-y divide-[var(--border)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 pb-1">
                  {specs.map((item) => (
                    <div key={item.label} className="flex justify-between sm:flex-col sm:justify-start gap-0.5 py-0.5">
                      <span className="text-[var(--text-2)] text-[11px] font-medium">{item.label}</span>
                      <span className="font-semibold text-[var(--text)] break-words text-right sm:text-left">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sertifikat Gemologi Resmi (jika ada) */}
            {certNumber && (
              <div className="mt-3 p-3 bg-[#E1ECF7]/40 dark:bg-white/5 border border-[#1D4E7A]/20 dark:border-white/10 rounded-xl flex items-center justify-between gap-2.5 text-xs text-[var(--text)]">
                <div className="flex items-center gap-2 min-w-0">
                  <Award className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
                  <span className="truncate">Sertifikat Resmi: <strong>{certNumber}</strong></span>
                </div>
                {certUrl && (
                  <a
                    href={resolveMediaUrl(certUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8A6A2F] text-white hover:bg-[#725624] text-[11px] font-semibold shrink-0 transition-colors shadow-xs"
                  >
                    <span>Lihat Sertifikat</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}

            {product.description && (
              <p className="mt-4 text-xs text-[var(--text-2)] leading-relaxed">
                {product.description}
              </p>
            )}
          </div>

          {/* Tombol Aksi */}
          <div className="mt-6 pt-3 border-t border-[var(--border)] sticky bottom-0 bg-[var(--surface)]/95 backdrop-blur-xs flex flex-col gap-2.5">
            <button
              type="button"
              disabled={product.stock !== undefined && product.stock <= 0}
              onClick={async () => {
                const added = await addToCart(product);
                if (added) {
                  onAddToCart(product.name);
                  onClose();
                }
              }}
              className="w-full min-h-[44px] rounded-full bg-[#12263A] dark:bg-[#D9B877] text-white dark:text-[#12263A] hover:bg-[#1A3652] dark:hover:bg-[#C9A55B] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <ShoppingBag className="w-4 h-4 text-[#D9B877] dark:text-[#12263A]" />
              <span>{product.stock !== undefined && product.stock <= 0 ? 'Stok Habis' : 'Tambah ke Keranjang Belanja'}</span>
            </button>

            <a
              href={`https://wa.me/6281239001122?text=Halo%20Atelier%20CDE%20Pearls,%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full min-h-[44px] rounded-full border border-[var(--border)] text-[var(--text)] hover:bg-[var(--surface-2)] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877]" />
              <span>Konsultasi via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
