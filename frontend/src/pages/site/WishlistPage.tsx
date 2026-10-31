import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';
import { Heart, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';

export const WishlistPage: React.FC = () => {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  useEffect(() => {
    document.title = "Koleksi Favorit Saya | CD'E Pearls Lombok";
  }, []);

  const handleMoveAllToCart = () => {
    wishlist.forEach((item) => {
      addToCart(item);
    });
    toast.success(`✓ Semua (${wishlist.length}) koleksi favorit dipindahkan ke keranjang.`);
  };

  return (
    <div className="w-full font-sans">
      {/* ========================================================
          MOBILE VIEW (< lg) - MARKETPLACE STYLE (TAHAP Q7)
         ======================================================== */}
      <div className="lg:hidden w-full flex flex-col p-3 pb-24 space-y-3 bg-[var(--bg)]">
        {/* Header Favorit */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border)] px-1">
          <div>
            <h2 className="font-serif text-lg font-bold text-[var(--text)]">
              Koleksi Favorit
            </h2>
            <span className="text-[11px] text-[var(--text-2)]">
              {wishlist.length} perhiasan tersimpan
            </span>
          </div>

          {wishlist.length > 0 && (
            <button
              type="button"
              onClick={handleMoveAllToCart}
              className="min-h-[40px] px-3.5 rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-[11px] font-bold flex items-center gap-1.5 touch-feedback cursor-pointer shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Semua ke Keranjang</span>
            </button>
          )}
        </div>

        {wishlist.length === 0 ? (
          /* Keadaan Kosong Mobile */
          <div className="py-16 text-center space-y-3 bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6">
            <div className="w-14 h-14 mx-auto rounded-full bg-[var(--surface-2)] flex items-center justify-center text-[#8A6A2F] dark:text-[#D9B877]">
              <Heart className="w-7 h-7 stroke-[1.5]" />
            </div>
            <h2 className="font-serif text-base font-bold text-[var(--text)]">
              Belum Ada Koleksi Favorit
            </h2>
            <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto leading-relaxed">
              Jelajahi keindahan perhiasan mutiara laut selatan Lombok kami dan simpan butir favorit Anda.
            </p>
            <button
              type="button"
              onClick={() => navigate('/katalog')}
              className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-semibold touch-feedback shadow-xs"
            >
              Mulai Belanja
            </button>
          </div>
        ) : (
          /* Grid 2 Kolom Kartu Produk (Q4) */
          <div className="grid grid-cols-2 gap-2">
            {wishlist.map((item) => (
              <ProductCard
                key={item.id}
                id={item.id}
                name={item.name}
                category={(item as any).category || item.category_slug || 'Mutiara South Sea'}
                variety={(item as any).variety || 'South Sea Pearl'}
                grade={(item as any).grade || item.pearl_grade || 'AAA'}
                price={item.price}
                formattedPrice={`Rp ${(item.price || 0).toLocaleString('id-ID')}`}
                image={item.image}
                rating={4.9}
                soldCount={12}
                isWishlisted={true}
                onToggleWishlist={() => toggleWishlist(item)}
                onAddToCart={() => {
                  addToCart(item);
                  toast.success(`✓ ${item.name} ditambahkan ke keranjang.`);
                }}
                onSelect={() => navigate(`/produk/${item.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ========================================================
          DESKTOP VIEW (hidden lg:block) - TERKUNCI & TETAP LENGKAP
         ======================================================== */}
      <div className="hidden lg:block w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
        <div className="flex flex-row items-center justify-between pb-6 border-b border-[#E6DDD0] dark:border-white/10 gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8A6A2F] dark:text-[#D9B877] mb-1">
              <Heart className="w-3.5 h-3.5 fill-[#8A6A2F] text-[#8A6A2F]" />
              <span>Koleksi Impian</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Koleksi Favorit Saya
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[#4A5666] dark:text-[#D9B877]">
              {wishlist.length} butir perhiasan tersimpan
            </span>
            {wishlist.length > 0 && (
              <button
                type="button"
                onClick={handleMoveAllToCart}
                className="min-h-[40px] px-5 rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs hover:opacity-90"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Pindahkan Semua ke Keranjang</span>
              </button>
            )}
          </div>
        </div>

        {wishlist.length === 0 ? (
          <div className="py-16 text-center space-y-4 bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-8">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#F4F1EB] dark:bg-white/5 flex items-center justify-center text-[#8A6A2F]">
              <Heart className="w-8 h-8 opacity-40" />
            </div>
            <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Belum Ada Koleksi yang Disimpan
            </h2>
            <p className="text-xs text-[#4A5666] dark:text-[#D9B877] max-w-md mx-auto leading-relaxed">
              Jelajahi keindahan perhiasan mutiara laut selatan Lombok kami dan tandai butir mutiara yang Anda impikan.
            </p>
            <Link
              to="/katalog"
              className="inline-flex items-center gap-2 min-h-[44px] px-6 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] cursor-pointer shadow-md"
            >
              <span>Jelajahi Katalog Produk</span>
              <ArrowRight className="w-4 h-4 text-[#D9B877]" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist.map((item) => {
              const grade = (item as any).grade || item.pearl_grade;
              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#12263A] rounded-2xl border border-[#E6DDD0] dark:border-white/10 overflow-hidden shadow-xs flex flex-col justify-between group"
                >
                  <div className="relative aspect-4/3 overflow-hidden bg-[#F4F1EB]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {grade && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-[#12263A]/85 text-[#D9B877] text-[10px] font-bold">
                        Grade {grade}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleWishlist(item)}
                      aria-label="Hapus dari favorit"
                      className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/90 text-red-500 flex items-center justify-center hover:bg-white transition-colors cursor-pointer shadow-xs"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-sm font-bold text-[#12263A] dark:text-[#FBF8F3] line-clamp-2">
                        <Link to={`/produk/${item.id}`} className="hover:text-[#8A6A2F]">
                          {item.name}
                        </Link>
                      </h3>
                      <p className="font-serif text-sm font-semibold text-[#8A6A2F] dark:text-[#D9B877] mt-1">
                        Rp {(item.price || 0).toLocaleString('id-ID')}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        addToCart(item);
                        toast.success(`✓ ${item.name} ditambahkan ke keranjang.`);
                      }}
                      className="w-full min-h-[38px] px-3 rounded-xl bg-[#12263A] text-white hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[#D9B877]" />
                      <span>Pindahkan ke Keranjang</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
