import React, { useState } from 'react';
import { ShoppingBag, Heart, Star, Sparkles, ShieldCheck } from 'lucide-react';

interface ProductCardProps {
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
  onAddToCart?: () => void;
  onToggleWishlist?: () => void;
  isWishlisted?: boolean;
  onSelect?: () => void;
  showWishlist?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  category = 'Mutiara South Sea',
  variety = 'South Sea Pearl',
  grade = 'AAA',
  pearlSize,
  metal,
  price,
  formattedPrice,
  image,
  rating,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
  onSelect,
  showWishlist = true,
}) => {
  const numericPrice = typeof price === 'number' ? price : parseInt(String(price).replace(/\D/g, ''), 10) || 12500000;
  const displayPrice = formattedPrice || `Rp ${numericPrice.toLocaleString('id-ID')}`;
  const originalPrice = `Rp ${Math.round(numericPrice * 1.15).toLocaleString('id-ID')}`;

  const hasCustomImage = Boolean(image && image.trim() && !image.includes('placeholder'));

  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (hasCustomImage && image) return image;
    // Smart fallback ke foto kategori
    if (name.toLowerCase().includes('cincin') || category.toLowerCase().includes('cincin')) {
      return '/images/cat_ring_silk.jpg';
    }
    if (name.toLowerCase().includes('gelang') || category.toLowerCase().includes('gelang')) {
      return '/images/featured_pearl_dark_luxury.jpg';
    }
    if (name.toLowerCase().includes('anting') || category.toLowerCase().includes('anting')) {
      return '/images/terroir_pearl_plate_left.jpg';
    }
    if (name.toLowerCase().includes('lepas') || category.toLowerCase().includes('lepas')) {
      return '/images/hero_pearl_dark_luxury.jpg';
    }
    return '/images/hero_pearl_shell.jpg';
  });

  const specsText = [grade ? `Grade ${grade}` : null, pearlSize, metal].filter(Boolean).join(' • ') || `${variety} • Grade ${grade}`;

  return (
    <div className="group bg-white border border-[#E6DDD0] rounded-2xl p-4 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:border-[#8A6A2F]/60 hover:shadow-xl hover:-translate-y-1">
      <div>
        {/* Luxury Jewelry Image Container */}
        <div
          className="relative w-full h-[240px] sm:h-[260px] rounded-xl overflow-hidden cursor-pointer bg-gradient-to-b from-[#F7F4EE] to-[#EBE5DA] border border-[#E6DDD0]/60"
          onClick={onSelect}
        >
          <picture className="w-full h-full block">
            {imgSrc.endsWith('.jpg') && (
              <source type="image/webp" srcSet={imgSrc.replace('.jpg', '.webp')} />
            )}
            <img
              src={imgSrc}
              alt={`Perhiasan ${name} - ${category}`}
              width={400}
              height={300}
              onError={() => setImgSrc('/images/hero_pearl_shell.jpg')}
              className="w-full h-full object-cover aspect-[4/3] transition-transform duration-700 ease-out group-hover:scale-106"
              loading="lazy"
              decoding="async"
              style={{ contentVisibility: 'auto' }}
            />
          </picture>

          {/* Label Foto Ilustrasi jika produk menggunakan foto kategori */}
          {!hasCustomImage && (
            <span className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#12263A]/85 text-[#D9B877] backdrop-blur-xs border border-[#D9B877]/30 shadow-xs z-10">
              Foto ilustrasi
            </span>
          )}

          {/* Pearl Luster Sheen Highlight Effect on Hover */}
          <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Wishlist Button */}
          {showWishlist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleWishlist?.();
              }}
              aria-label="Simpan ke favorit"
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center border transition-all duration-200 cursor-pointer shadow-sm ${
                isWishlisted
                  ? 'bg-[#12263A] text-[#D9B877] border-[#12263A] scale-105'
                  : 'bg-white/90 text-[#12263A] border-[#E6DDD0] hover:bg-white hover:scale-110 active:scale-95'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#BA4E4E] text-[#BA4E4E]' : ''}`} />
            </button>
          )}

          {/* Badges on Bottom of Image */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#12263A]/90 text-[#D9B877] backdrop-blur-md border border-[#D9B877]/30 shadow-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#D9B877]" />
              <span>{variety}</span>
            </span>

            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/90 text-[#12263A] backdrop-blur-md border border-[#E6DDD0] shadow-xs">
              <ShieldCheck className="w-3 h-3 text-[#8A6A2F]" />
              <span>Sertifikat lab</span>
            </span>
          </div>
        </div>

        {/* Product Details */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
              {category}
            </span>

            {/* Rating Bintang hanya tampil jika datanya ada */}
            {typeof rating === 'number' && rating > 0 && (
              <div className="flex items-center gap-0.5 text-[#8A6A2F]" title={`${rating} Bintang Ulasan`}>
                {[...Array(Math.floor(rating))].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-[#8A6A2F] text-[#8A6A2F]" />
                ))}
              </div>
            )}
          </div>

          <h3
            onClick={onSelect}
            className="font-serif text-[19px] sm:text-[21px] font-medium text-[#12263A] line-clamp-2 cursor-pointer hover:text-[#8A6A2F] transition-colors leading-snug"
          >
            {name}
          </h3>

          <p className="mt-1.5 text-[12.5px] text-[#4A5666] line-clamp-1">
            {specsText}
          </p>
        </div>
      </div>

      {/* Pricing & Add to Cart */}
      <div className="mt-5 pt-3.5 border-t border-[#E6DDD0]/70 flex items-center justify-between gap-3">
        <div>
          <span className="text-[10px] text-[#4A5666] uppercase tracking-wider block">Harga Atelier</span>
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-[18px] sm:text-[20px] font-bold text-[#12263A]">
              {displayPrice}
            </span>
            <span className="text-[11px] text-[#4A5666]/60 line-through">
              {originalPrice}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onAddToCart}
          className="min-h-[42px] px-4 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all inline-flex items-center gap-2 text-xs font-semibold shrink-0 cursor-pointer shadow-xs hover:shadow-md"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#D9B877]" />
          <span>Tambah</span>
        </button>
      </div>
    </div>
  );
};
