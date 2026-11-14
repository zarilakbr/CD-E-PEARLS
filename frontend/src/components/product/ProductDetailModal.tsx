import React from 'react';
import { X, Award, ShoppingBag, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] rounded-2xl sm:rounded-3xl w-[calc(100%-1rem)] max-w-3xl overflow-hidden shadow-2xl relative max-h-[96dvh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup (Touch Target 44x44) */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 z-20 min-h-[44px] min-w-[44px] rounded-full bg-[var(--surface)]/90 border border-[var(--border)] flex items-center justify-center text-[var(--text)] hover:bg-[var(--bg-dash)] transition-colors cursor-pointer shadow-xs"
          aria-label="Tutup jendela"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gambar Produk Kiri */}
        <div className="w-full md:w-1/2 h-[240px] sm:h-[300px] md:h-auto min-h-[220px] md:min-h-[320px] bg-[#12263A] relative shrink-0 overflow-hidden group">
          <picture className="w-full h-full block">
            <source
              type="image/webp"
              srcSet={resolveWebpUrl(getSmartImageFallback(product))}
            />
            <img
              src={getSmartImageFallback(product)}
              alt={`Detail perhiasan ${product.name} — ${typeof product.category === 'object' && product.category ? (product.category as { name?: string }).name || 'Mutiara Lombok' : product.category || 'Mutiara Lombok'}`}
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
          {/* Subtle gradient vignette & sheen */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Badges */}
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex flex-col gap-1.5">
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

          <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-10 flex items-center justify-between text-white/90 text-[11px] font-medium backdrop-blur-md bg-black/40 px-3 py-2 rounded-xl border border-white/10">
            <span className="flex items-center gap-1.5 truncate">
              <Sparkles className="w-3.5 h-3.5 text-[#D9B877] shrink-0" />
              <span className="truncate">Sekotong &amp; Medana, Lombok</span>
            </span>
            <span className="text-[#D9B877] font-semibold shrink-0 ml-1">100% Pinctada maxima</span>
          </div>
        </div>

        {/* Detail Produk Kanan */}
        <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                {product.category}
              </span>
              <span className="opacity-40">•</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--surface-muted)] text-[var(--text)] border border-[var(--border)]">
                {product.variety}
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[var(--text)] leading-tight break-words">
              {product.name}
            </h2>

            <div className="mt-2.5 font-serif text-2xl font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
              {product.formattedPrice}
            </div>

            {/* Spesifikasi Lengkap Grid (1 col on <= 380px, 2 col on > 380px) */}
            <div className="mt-4 grid grid-cols-1 min-[380px]:grid-cols-2 gap-2 sm:gap-2.5 p-3 sm:p-3.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-xs">
              <div>
                <span className="text-[var(--text-2)] block">Grade Mutiara:</span>
                <span className="font-semibold text-[var(--text)]">{product.grade} (Mirror Luster)</span>
              </div>
              <div>
                <span className="text-[var(--text-2)] block">Ukuran Diameter:</span>
                <span className="font-semibold text-[var(--text)]">{product.pearlSize}</span>
              </div>
              <div>
                <span className="text-[var(--text-2)] block">Logam &amp; Rangka:</span>
                <span className="font-semibold text-[var(--text)]">{product.metal}</span>
              </div>
              <div>
                <span className="text-[var(--text-2)] block">Berat Estimasi:</span>
                <span className="font-semibold text-[var(--text)]">{product.weight}</span>
              </div>
            </div>

            {/* Sertifikat Gemologi Tersimpan */}
            <div className="mt-3 p-3 bg-[var(--info-bg)]/80 border border-[var(--info-border)] rounded-xl flex items-center gap-2.5 text-xs text-[var(--info-text)]">
              <Award className="w-4 h-4 shrink-0" />
              <span>Sertifikat Resmi: <strong>{product.certificateNo || 'LAB-LMB-8921'}</strong> (Sertifikat lab gemologi)</span>
            </div>

            <p className="mt-3 sm:mt-4 text-[13px] sm:text-xs text-[var(--text-2)] leading-relaxed break-words">
              {product.description}
            </p>
          </div>

          {/* Tombol Aksi (Sticky/Pinned at bottom for mobile) */}
          <div className="mt-5 pt-3 border-t border-[var(--border)] sticky bottom-0 bg-[var(--surface)]/95 backdrop-blur-xs flex flex-col gap-2.5 pb-safe">
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
              className="w-full min-h-[44px] rounded-full bg-[#12263A] dark:bg-[#D9B877] text-white dark:text-[#0B1622] hover:bg-[#1A3652] dark:hover:bg-[#E5C98F] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
            >
              <ShoppingBag className="w-4 h-4 text-[#D9B877] dark:text-[#0B1622]" />
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

export default ProductDetailModal;
