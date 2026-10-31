import React from 'react';
import { Heart, ShoppingBag, Sparkles, Star } from 'lucide-react';
import type { Product } from '../../types';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetail }) => {
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();
  const isFav = isInWishlist(product.id);

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleFav = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className="group relative flex flex-col justify-between rounded-[20px] sm:rounded-[24px] border border-[#261E1A] hover:border-[#C5A880]/60 bg-[#140F0D] hover:bg-[#181310] p-3.5 sm:p-4 shadow-[0_4px_25px_rgba(0,0,0,0.5)] hover:shadow-[0_12px_35px_rgba(197,168,128,0.12)] hover:-translate-y-1 backdrop-blur-md transition-all duration-300 cursor-pointer overflow-hidden"
    >
      {/* Top Wishlist Heart Icon */}
      <button
        onClick={handleToggleFav}
        title={isFav ? 'Hapus dari Favorit' : 'Simpan ke Favorit'}
        className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 z-10 w-8 sm:w-9 h-8 sm:h-9 rounded-full bg-black/50 hover:bg-black/70 shadow-md backdrop-blur-md flex items-center justify-center hover:scale-110 active:scale-95 transition-all cursor-pointer border border-white/10"
      >
        <Heart
          size={15}
          className={
            isFav
              ? 'fill-[#BA4E4E] text-[#BA4E4E]'
              : 'text-white/60 hover:text-white transition-colors'
          }
        />
      </button>

      {/* Discount Tag */}
      {product.discount_percent > 0 && (
        <span className="absolute top-3.5 sm:top-4 left-3.5 sm:left-4 z-10 rounded-full bg-[#BA4E4E] text-white px-2 sm:px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shadow-sm">
          -{product.discount_percent}% OFF
        </span>
      )}

      {/* Product Image on Ceramic Pedestal */}
      <div className="relative w-full aspect-square rounded-[16px] sm:rounded-[18px] overflow-hidden bg-gradient-to-b from-[#1F1815] to-[#0D0B0A] mb-3 sm:mb-3.5 flex items-center justify-center border border-[#2D231E]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        {/* Subtle pearl luster overlay highlight on hover */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-amber-200/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          {/* Variety & Grade Tag + Star Rating */}
          <div className="flex items-center justify-between gap-1 text-[9.5px] sm:text-[10px] text-[#C5A880] font-semibold tracking-wider uppercase mb-1.5">
            <span className="inline-flex items-center gap-1 truncate">
              <Sparkles size={10} className="text-[#C5A880] shrink-0" />
              <span className="truncate">{product.pearl_grade || 'Grade AAA'}</span>
            </span>
            <div className="flex items-center gap-0.5 text-[#C5A880] shrink-0">
              <Star size={10} className="fill-[#C5A880] text-[#C5A880]" />
              <Star size={10} className="fill-[#C5A880] text-[#C5A880]" />
              <Star size={10} className="fill-[#C5A880] text-[#C5A880]" />
              <Star size={10} className="fill-[#C5A880] text-[#C5A880]" />
              <Star size={10} className="fill-[#C5A880] text-[#C5A880]" />
            </div>
          </div>

          {/* Title */}
          <h4 className="font-serif text-sm sm:text-[15px] font-bold text-[#F5ECE5] line-clamp-2 leading-snug group-hover:text-[#C5A880] transition-colors mb-2">
            {product.name}
          </h4>
        </div>

        {/* Pricing & Add to Cart */}
        <div className="pt-1.5 sm:pt-2">
          <div className="flex items-baseline gap-2 mb-2.5 sm:mb-3">
            <span className="font-sans text-base sm:text-[17px] font-bold text-[#C5A880] tracking-tight">
              {formatIDR(product.price)}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-[11px] sm:text-[12px] text-white/40 line-through">
                {formatIDR(product.original_price)}
              </span>
            )}
          </div>

          {/* ADD TO CART Luxury Button */}
          <button
            onClick={handleAddToCart}
            className="w-full h-9 sm:h-10 rounded-full bg-gradient-to-r from-[#C5A880] to-[#B39368] hover:from-[#B39368] hover:to-[#A18055] text-[#120E0C] text-[10px] sm:text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 sm:gap-2 shadow-[0_2px_15px_rgba(197,168,128,0.2)] hover:shadow-[0_4px_20px_rgba(197,168,128,0.35)] transition-all duration-200 cursor-pointer active:scale-98"
          >
            <ShoppingBag size={13} />
            <span>Tambah ke Tas</span>
          </button>
        </div>
      </div>
    </div>
  );
};

