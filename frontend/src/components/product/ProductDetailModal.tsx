import React from 'react';
import { X, Award, ShoppingBag, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react';
import type { MockProduct } from '../../data/mock';

interface ProductDetailModalProps {
  product: MockProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (name: string) => void;
}

const getSmartImageFallback = (item: MockProduct) => {
  if (item.image && !item.image.includes('placeholder')) return item.image;
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
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white border border-[#E6DDD0] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative max-h-[92dvh] flex flex-col md:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 z-20 min-h-[44px] min-w-[44px] rounded-full bg-white/90 border border-[#E6DDD0] flex items-center justify-center text-[#12263A] hover:bg-[#F4F1EB] transition-colors cursor-pointer shadow-xs"
          aria-label="Tutup jendela"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Gambar Produk Kiri (Tinggi besar dengan Foto Mewah Asli) */}
        <div className="w-full md:w-1/2 h-[300px] md:h-auto min-h-[320px] bg-[#12263A] relative shrink-0 overflow-hidden group">
          <picture className="w-full h-full block">
            {getSmartImageFallback(product).endsWith('.jpg') && (
              <source
                type="image/webp"
                srcSet={getSmartImageFallback(product).replace('.jpg', '.webp')}
              />
            )}
            <img
              src={getSmartImageFallback(product)}
              alt={`Detail perhiasan ${product.name}`}
              width={500}
              height={500}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
          </picture>
          {/* Subtle gradient vignette & sheen */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

          {/* Floating Badges */}
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1.5">
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

          <div className="absolute bottom-4 left-4 right-4 z-10 flex items-center justify-between text-white/90 text-[11px] font-medium backdrop-blur-md bg-black/40 px-3 py-2 rounded-xl border border-white/10">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D9B877]" />
              Sekotong &amp; Medana, Lombok
            </span>
            <span className="text-[#D9B877] font-semibold">100% Pinctada maxima</span>
          </div>
        </div>

        {/* Detail Produk Kanan */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto custom-scrollbar">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                {product.category}
              </span>
              <span className="text-gray-300">•</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F4F1EB] text-[#12263A]">
                {product.variety}
              </span>
            </div>

            <h2 className="font-serif text-2xl sm:text-3xl font-medium text-[#12263A] leading-tight">
              {product.name}
            </h2>

            <div className="mt-3 font-serif text-2xl font-semibold text-[#12263A]">
              {product.formattedPrice}
            </div>

            {/* Spesifikasi Lengkap Grid */}
            <div className="mt-5 grid grid-cols-2 gap-2.5 p-3.5 bg-[#FBF8F3] border border-[#E6DDD0] rounded-xl text-xs">
              <div>
                <span className="text-[#4A5666] block">Grade Mutiara:</span>
                <span className="font-semibold text-[#12263A]">{product.grade} (Mirror Luster)</span>
              </div>
              <div>
                <span className="text-[#4A5666] block">Ukuran Diameter:</span>
                <span className="font-semibold text-[#12263A]">{product.pearlSize}</span>
              </div>
              <div>
                <span className="text-[#4A5666] block">Logam &amp; Rangka:</span>
                <span className="font-semibold text-[#12263A]">{product.metal}</span>
              </div>
              <div>
                <span className="text-[#4A5666] block">Berat Estimasi:</span>
                <span className="font-semibold text-[#12263A]">{product.weight}</span>
              </div>
            </div>

            {/* Sertifikat Gemologi Tersimpan */}
            <div className="mt-3 p-3 bg-[#E1ECF7]/50 border border-[#1D4E7A]/20 rounded-xl flex items-center gap-2.5 text-xs text-[#1D4E7A]">
              <Award className="w-4 h-4 shrink-0" />
              <span>Sertifikat Resmi: <strong>{product.certificateNo || 'LAB-LMB-8921'}</strong> (Sertifikat lab gemologi)</span>
            </div>

            <p className="mt-4 text-xs text-[#4A5666] leading-relaxed">
              {product.description}
            </p>
          </div>

          {/* Tombol Aksi (Sticky/Pinned at bottom for mobile) */}
          <div className="mt-6 pt-3 border-t border-[#E6DDD0] sticky bottom-0 bg-white/95 backdrop-blur-xs flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => {
                onAddToCart(product.name);
                onClose();
              }}
              className="w-full min-h-[44px] rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-[#D9B877]" />
              <span>Tambah ke Keranjang Belanja</span>
            </button>

            <a
              href={`https://wa.me/6281239001122?text=Halo%20Atelier%20CDE%20Pearls,%20saya%20tertarik%20dengan%20produk%20${encodeURIComponent(product.name)}`}
              target="_blank"
              rel="noreferrer"
              className="w-full min-h-[44px] rounded-full border border-[#12263A] text-[#12263A] hover:bg-[#12263A]/5 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#8A6A2F]" />
              <span>Konsultasi via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
