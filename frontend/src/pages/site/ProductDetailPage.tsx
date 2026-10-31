import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { mockProducts } from '../../data/mock';
import { catalogApi } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import {
  ShieldCheck,
  Heart,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<any | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isAddedToast, setIsAddedToast] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Check mock products first
    const foundMock = mockProducts.find((p) => String(p.id) === String(id));
    if (foundMock) {
      setProduct(foundMock);
      setSelectedImage(foundMock.image || '/images/hero_pearl_shell.jpg');
      document.title = `${foundMock.name} | CD'E Pearls Lombok`;
    } else {
      // Try catalog API
      catalogApi
        .getProduct(id)
        .then((res: any) => {
          if (res) {
            setProduct(res);
            setSelectedImage(res.image || '/images/hero_pearl_shell.jpg');
            document.title = `${res.name} | CD'E Pearls Lombok`;
          }
        })
        .catch(() => {
          if (mockProducts.length > 0) {
            const fallback = mockProducts[0];
            setProduct(fallback);
            setSelectedImage(fallback.image || '/images/hero_pearl_shell.jpg');
            document.title = `${fallback.name} | CD'E Pearls Lombok`;
          }
        });
    }
  }, [id]);

  if (!product) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-16 text-center">
        <div className="w-8 h-8 border-2 border-[#8A6A2F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#4A5666]">Memuat detail koleksi mutiara...</p>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);

  const handleAddToCart = () => {
    addToCart(product);
    setIsAddedToast(true);
    setTimeout(() => setIsAddedToast(false), 3000);
  };

  const images: string[] = product.images && Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : [product.image || '/images/hero_pearl_shell.jpg'];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 space-y-10">
      {/* Breadcrumb / Back */}
      <div className="flex items-center gap-2 text-xs text-[#4A5666] dark:text-[#D9B877]">
        <Link to="/katalog" className="hover:text-[#12263A] flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Katalog Koleksi</span>
        </Link>
        <span>/</span>
        <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3] truncate max-w-xs">
          {product.name}
        </span>
      </div>

      {/* Main Product Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Photo Gallery (Left Column) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 shadow-lg">
            <img
              src={selectedImage || product.image}
              alt={product.name}
              className="w-full h-full object-cover object-center transition-all duration-300"
            />
            {product.grade && (
              <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#12263A]/90 backdrop-blur-md text-[#D9B877] text-xs font-bold border border-[#D9B877]/30 tracking-wider">
                Grade {product.grade}
              </span>
            )}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={isFavorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 dark:bg-[#12263A]/90 backdrop-blur-md flex items-center justify-center text-[#12263A] dark:text-[#FBF8F3] hover:text-red-600 transition-colors cursor-pointer shadow-md"
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-red-500 text-red-500' : ''}`} />
            </button>
          </div>

          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {images.map((img: string, idx: number) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedImage(img)}
                  className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0 ${
                    selectedImage === img ? 'border-[#8A6A2F]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`${product.name} thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Specifications & Purchase (Right Column) */}
        <div className="lg:col-span-5 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8A6A2F] dark:text-[#D9B877] mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{product.category || 'Mutiara Laut Selatan'}</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#12263A] dark:text-[#FBF8F3] leading-tight">
              {product.name}
            </h1>
            <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#8A6A2F] dark:text-[#D9B877] mt-3">
              Rp {(product.price || 0).toLocaleString('id-ID')}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] leading-relaxed font-light">
            {product.description ||
              'Mahakarya perhiasan mutiara laut selatan alami dari perairan murni Sekotong & Medana, Lombok. Dirangkai dengan emas 18K solid dan dilengkapi sertifikat uji lab gemologi keaslian.'}
          </p>

          {/* Specifications Table */}
          <div className="rounded-2xl border border-[#E6DDD0] dark:border-white/10 divide-y divide-[#E6DDD0] dark:divide-white/10 text-xs">
            <div className="flex justify-between p-3 bg-[#FBF8F3] dark:bg-white/5">
              <span className="text-[#4A5666] dark:text-[#D9B877]">Grade Gemologi</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">{product.grade || 'AAA'}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-[#4A5666] dark:text-[#D9B877]">Ukuran / Diameter</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                {product.size_mm || product.pearl_size || '11–13 mm'}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-[#FBF8F3] dark:bg-white/5">
              <span className="text-[#4A5666] dark:text-[#D9B877]">Rangka Logam</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">{product.metal || 'Emas Kuning 18K Solid'}</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-[#4A5666] dark:text-[#D9B877]">Lokasi Budidaya</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">Sekotong &amp; Medana, Lombok</span>
            </div>
            <div className="flex justify-between p-3 bg-[#FBF8F3] dark:bg-white/5">
              <span className="text-[#4A5666] dark:text-[#D9B877]">Masa Tumbuh Tiram</span>
              <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">24–36 Bulan Alami</span>
            </div>
            <div className="flex justify-between p-3">
              <span className="text-[#4A5666] dark:text-[#D9B877]">Sertifikasi</span>
              <span className="font-semibold text-[#8A6A2F] dark:text-[#D9B877]">Sertifikat Gemologi Termasuk</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={handleAddToCart}
              className="w-full min-h-[48px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ShoppingBag className="w-4 h-4 text-[#D9B877]" />
              <span>Tambah ke Keranjang Belanja</span>
            </button>

            <a
              href={`https://wa.me/6281239887766?text=Halo%20Atelier%20CD'E%20Pearls,%20saya%20tertarik%20dengan%20koleksi%20${encodeURIComponent(
                product.name
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full min-h-[48px] px-6 rounded-full border border-[#12263A] dark:border-white/20 text-[#12263A] dark:text-[#FBF8F3] hover:bg-[#F4F1EB] dark:hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-500" />
              <span>Konsultasi Private via WhatsApp</span>
            </a>
          </div>

          {isAddedToast && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>✓ Berhasil ditambahkan ke keranjang belanja Anda.</span>
            </div>
          )}

          {/* Assurance Badges */}
          <div className="pt-4 border-t border-[#E6DDD0] dark:border-white/10 flex items-center justify-between text-[11px] text-[#4A5666] dark:text-[#D9B877]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#8A6A2F]" />
              <span>100% Asli Terverifikasi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#8A6A2F]" />
              <span>Pengiriman Berasuransi Penuh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
