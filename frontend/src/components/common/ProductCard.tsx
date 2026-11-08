import React, { useState, useEffect } from 'react';
import { Heart, ShieldCheck, Star, ShoppingBag } from 'lucide-react';
import { cn } from '../../lib/utils';
import { resolveMediaUrl } from '../../lib/media';

export interface ProductCardProps {
  id?: number;
  name: string;
  category?: string;
  variety?: string;
  grade?: string;
  pearlSize?: string;
  metal?: string;
  price: string | number;
  formattedPrice?: string;
  image?: string;
  rating?: number;
  soldCount?: number;
  isSoldOut?: boolean;
  hasCertificate?: boolean;
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  onSelect?: () => void;
  showWishlist?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  category = 'Mutiara South Sea',
  variety: _variety = 'South Sea Pearl',
  grade: _grade = 'AAA',
  price,
  formattedPrice,
  image,
  rating,
  soldCount,
  isSoldOut = false,
  hasCertificate = true,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  onSelect,
  showWishlist = true,
}) => {
  const numericPrice =
    typeof price === 'number'
      ? price
      : parseInt(String(price).replace(/\D/g, ''), 10) || 0;
  const displayPrice = formattedPrice || (numericPrice > 0 ? `Rp ${numericPrice.toLocaleString('id-ID')}` : 'Hubungi Kami');

  const resolvedCustomImage = image ? resolveMediaUrl(image) : '';
  const hasCustomImage = Boolean(resolvedCustomImage && resolvedCustomImage.trim() && !resolvedCustomImage.includes('placeholder'));

  const computeFallbackImage = () => {
    if (hasCustomImage && resolvedCustomImage) return resolvedCustomImage;
    const n = (name || '').toLowerCase();
    const catStr = typeof category === 'string' 
      ? category 
      : (typeof category === 'object' && category ? (category as any).name || (category as any).slug || '' : '');
    const c = catStr.toLowerCase();
    if (n.includes('cincin') || c.includes('cincin')) return '/images/placeholder_jewelry.svg';
    if (n.includes('gelang') || c.includes('gelang')) return '/images/featured_pearl_dark_luxury.jpg';
    if (n.includes('anting') || c.includes('anting')) return '/images/terroir_pearl_plate_left.jpg';
    if (n.includes('lepas') || c.includes('lepas')) return '/images/hero_pearl_dark_luxury.jpg';
    return '/images/hero_pearl_shell.jpg';
  };

  const [imgSrc, setImgSrc] = useState<string>(computeFallbackImage);

  useEffect(() => {
    setImgSrc(computeFallbackImage());
  }, [image, name, category]);

  return (
    <div
      data-slot="product-card"
      onClick={onSelect}
      className={cn(
        'group relative bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-2.5 sm:p-3.5 flex flex-col justify-between cursor-pointer transition-all duration-200 select-none touch-feedback hover:border-[#8A6A2F]/60 hover:shadow-md',
        isSoldOut && 'opacity-65 grayscale-[35%]'
      )}
    >
      <div>
        {/* Gambar 1:1 Aspect Ratio (Square) */}
        <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-gradient-to-b from-[#F7F4EE] to-[#EBE5DA] dark:from-[#12263A] dark:to-[#0B1622] border border-[var(--border)]/50">
          <picture className="w-full h-full block">
            {imgSrc.endsWith('.jpg') && (
              <source type="image/webp" srcSet={imgSrc.replace('.jpg', '.webp')} />
            )}
            <img
              src={imgSrc}
              alt={`Perhiasan ${name} - ${category}`}
              width={320}
              height={320}
              onError={() => setImgSrc('/images/hero_pearl_shell.jpg')}
              className="w-full h-full object-cover aspect-square transition-transform duration-500 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
              style={{ contentVisibility: 'auto' }}
            />
          </picture>

          {/* Lencana Terjual jika barang habis */}
          {isSoldOut && (
            <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-xs uppercase tracking-wider backdrop-blur-xs">
              Terjual
            </span>
          )}

          {/* Overlay Kanan Atas: Ikon Hati dengan Area Sentuh 44px */}
          {showWishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist?.();
              }}
              aria-label={isWishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
              title={isWishlisted ? 'Hapus dari favorit' : 'Simpan ke favorit'}
              className="absolute top-1 right-1 w-11 h-11 flex items-center justify-center transition-transform active:scale-90 cursor-pointer z-10"
            >
              <div
                className={cn(
                  'w-8 h-8 rounded-full flex items-center justify-center border shadow-xs transition-colors',
                  isWishlisted
                    ? 'bg-[#12263A] text-[#BA4E4E] border-[#12263A]'
                    : 'bg-white/90 text-[#12263A] border-[#E6DDD0] hover:bg-white'
                )}
              >
                <Heart
                  className={cn(
                    'w-4 h-4',
                    isWishlisted ? 'fill-[#BA4E4E] text-[#BA4E4E] animate-heart-pop' : 'text-[#12263A]'
                  )}
                />
              </div>
            </button>
          )}

          {/* Overlay Kiri Bawah: Ikon Sertifikat Kecil (Tanpa Teks) */}
          {hasCertificate && (
            <div
              className="absolute bottom-2 left-2 w-6 h-6 rounded-full bg-[#12263A]/90 text-[#D9B877] border border-[#D9B877]/30 flex items-center justify-center shadow-xs backdrop-blur-xs"
              title="Disertai Sertifikat Keaslian Gemologi"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#D9B877]" />
            </div>
          )}
        </div>

        {/* Di Bawah Gambar: Nama Maksimal 2 Baris (13px) */}
        <div className="mt-2.5">
          <h3 className="text-[13px] font-medium text-[var(--text)] line-clamp-2 leading-snug group-hover:text-[#8A6A2F] dark:group-hover:text-[#D9B877] transition-colors">
            {name}
          </h3>
        </div>
      </div>

      {/* Harga Tebal Berwarna Aksen Satu Baris & Meta Ringkas */}
      <div className="mt-2 pt-1.5 flex flex-col justify-end">
        <div className="font-serif text-[15px] sm:text-[16px] font-bold text-[#8A6A2F] dark:text-[#D9B877] leading-none truncate">
          {displayPrice}
        </div>

        {/* Baris Meta: Rating & Terjual hanya bila datanya nyata */}
        {((typeof rating === 'number' && rating > 0) || (typeof soldCount === 'number' && soldCount > 0)) && (
          <div className="flex items-center gap-1.5 text-[11px] text-[var(--text-2)] mt-1.5 truncate">
            {typeof rating === 'number' && rating > 0 && (
              <span className="flex items-center gap-0.5 text-[#8A6A2F] font-semibold">
                <Star className="w-3 h-3 fill-[#8A6A2F] text-[#8A6A2F]" />
                <span>{rating.toFixed(1)}</span>
              </span>
            )}
            {typeof rating === 'number' && rating > 0 && typeof soldCount === 'number' && soldCount > 0 && (
              <span className="opacity-40">•</span>
            )}
            {typeof soldCount === 'number' && soldCount > 0 && (
              <span>Terjual {soldCount}</span>
            )}
          </div>
        )}

        {/* Tombol Tambah HANYA tampil di Desktop saat hover/fokus, tidak ada di layar sentuh mobile */}
        {onAddToCart && !isSoldOut && (
          <div className="hidden lg:group-hover:flex mt-2 pt-1 border-t border-[var(--border)] items-center justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onAddToCart();
              }}
              className="text-[11px] font-semibold text-[#8A6A2F] dark:text-[#D9B877] hover:underline flex items-center gap-1 py-0.5"
            >
              <ShoppingBag className="w-3 h-3" />
              <span>Tambah</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
