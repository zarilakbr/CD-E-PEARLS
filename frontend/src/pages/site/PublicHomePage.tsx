import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowRight,
  MessageCircle,
  ShieldCheck,
  Award,
  Filter,
  Compass,
} from 'lucide-react';
import { ProductCard } from '../../components/common/ProductCard';
import { PearlVarietiesMarquee } from '../../components/home/PearlVarietiesMarquee';
import { MobileMarketplaceHome } from '../../components/home/MobileMarketplaceHome';
import type { MockProduct } from '../../types/models';
import { catalogApi } from '../../lib/api';
import { resolveMediaUrl } from '../../lib/media';
import { useWishlist } from '../../context/WishlistContext';
import { useCart } from '../../context/CartContext';

interface PublicHomePageProps {
  onNavigate: (tab: string, filter?: string) => void;
  onAddToCart: (productName: string) => void;
  onSelectProduct?: (product: MockProduct) => void;
}

/**
 * Komponen Bola Mutiara Dekoratif (Radial-gradient putih ke krem)
 * Diameter 200–400px, opacity 0.25–0.4, aria-hidden, pointer-events-none, tidak menimpa teks.
 */
const PearlOrb: React.FC<{
  className?: string;
  size?: number;
  opacity?: number;
}> = ({ className = '', size = 300, opacity = 0.32 }) => (
  <div
    aria-hidden="true"
    className={`absolute rounded-full pointer-events-none select-none z-0 ${className}`}
    style={{
      width: `${size}px`,
      height: `${size}px`,
      opacity,
      background:
        'radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95) 0%, rgba(243, 235, 221, 0.65) 55%, rgba(217, 184, 119, 0.25) 100%)',
      filter: 'blur(14px)',
    }}
  />
);

/**
 * Komponen Grain Halus (SVG feTurbulence inline opacity 0.04)
 * Hanya aktif pada layar >= 640px (dimatikan pada mobile < 640px).
 */
const SubtleGrain: React.FC<{ id: string }> = ({ id }) => (
  <svg
    className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.04] z-0 hidden sm:block"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
  >
    <filter id={id}>
      <feTurbulence
        type="fractalNoise"
        baseFrequency="0.75"
        numOctaves="3"
        stitchTiles="stitch"
      />
    </filter>
    <rect width="100%" height="100%" filter={`url(#${id})`} />
  </svg>
);

/**
 * Pemisah Gelombang SVG Inline
 * Setinggi 48px (24px di ponsel) berwarna bagian sebelumnya.
 */
const WaveDivider: React.FC<{ fillColor: string; className?: string }> = ({
  fillColor,
  className = '',
}) => (
  <div
    className={`w-full overflow-hidden leading-none pointer-events-none -mb-[1px] relative z-10 ${className}`}
    aria-hidden="true"
  >
    <svg
      className="relative block w-full h-[24px] sm:h-[48px]"
      viewBox="0 0 1440 74"
      fill="none"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0,0 C240,65 480,74 720,40 C960,6 1200,65 1440,20 L1440,0 L0,0 Z"
        fill={fillColor}
      />
    </svg>
  </div>
);

/**
 * Pemisah Garis Emas Tipis 1px
 * linear-gradient transparent, #D9B877, transparent
 */
const GoldLineDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`w-full h-[1px] bg-gradient-to-r from-transparent via-[#D9B877] to-transparent pointer-events-none ${className}`}
    aria-hidden="true"
  />
);

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  onNavigate,
  onAddToCart,
  onSelectProduct,
}) => {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
  const [varietyFilter, setVarietyFilter] = useState('all');
  const [gradeFilter, setGradeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  // Live Data States dari API
  const [liveProducts, setLiveProducts] = useState<MockProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchCatalogData = () => {
    setIsLoading(true);
    setIsError(false);
    Promise.all([
      catalogApi.getProducts({ per_page: 50 }).catch((e) => {
        throw e;
      }),
      catalogApi.getCategories().catch(() => []),
    ])
      .then(([prodRes, catRes]) => {
        const pItems = prodRes?.data || prodRes;
        const cItems = catRes?.data || catRes;
        if (Array.isArray(pItems)) {
          const mapped: MockProduct[] = pItems.map((item: any) => ({
            id: item.id,
            name: item.name,
            category: item.category?.name || 'Mutiara South Sea',
            categorySlug: item.category_slug || item.category?.slug || 'kalung-mutiara',
            variety: item.varietas || 'South Sea',
            grade: item.grade || 'AAA',
            pearlSize: item.ukuran_mm ? `${item.ukuran_mm} mm` : '12 mm',
            metal: item.logam || 'Emas 18K',
            weight: item.berat || '5.0 gr',
            bentuk: item.bentuk || 'Bulat',
            colorGroup: item.kelompok_warna || 'putih',
            colorVariant: item.varian_warna || 'Silver White',
            price: Number(item.price) || 0,
            formattedPrice: `Rp ${Number(item.price).toLocaleString('id-ID')}`,
            stock: Number(item.stock) || 0,
            status: item.status === 'published' ? 'Aktif' : 'Nonaktif',
            description: item.description || '',
            image: resolveMediaUrl(item.image, '/images/placeholder_jewelry.svg'),
            images: Array.isArray(item.images)
              ? item.images.map((img: any) =>
                  typeof img === 'string'
                    ? resolveMediaUrl(img)
                    : { ...img, url: resolveMediaUrl(img.url) }
                )
              : item.images,
          }));
          setLiveProducts(mapped);
        } else {
          setLiveProducts([]);
        }
        if (Array.isArray(cItems)) {
          setCategories(cItems);
        }
      })
      .catch(() => {
        setIsError(true);
        setLiveProducts([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchCatalogData();
  }, []);

  // Filter products
  const filteredProducts = liveProducts.filter((p) => {
    if (selectedCategorySlug !== 'all' && p.categorySlug !== selectedCategorySlug) {
      return false;
    }
    if (varietyFilter !== 'all' && p.variety !== varietyFilter) {
      return false;
    }
    if (gradeFilter !== 'all' && p.grade !== gradeFilter) {
      return false;
    }
    return true;
  });

  return (
    <div className="w-full flex flex-col font-sans">
      {/* MOBILE VIEW (< lg): TAMPILAN MARKETPLACE (TAHAP Q) */}
      <div className="lg:hidden w-full">
        <MobileMarketplaceHome
          products={liveProducts}
          onSelectProduct={onSelectProduct || (() => {})}
          onAddToCart={onAddToCart}
        />
      </div>

      {/* DESKTOP VIEW (lg+): TERKUNCI & TETAP ELEGAN */}
      <div className="hidden lg:flex flex-col w-full">
        {/* ========================================================
            1. HERO SECTION (HAUTE JOAILLERIE SAMUDERA INDONESIA)
          Latar: Gradien ivory (#FBF8F3) ke champagne (#F3EBDD)
          + Kilau mutiara (radial-gradient putih 60% di sudut kanan atas)
          + Foto dalam bingkai bulat
          + Teks navy (#12263A)
          + Grain halus inline SVG
         ======================================================== */}
      <section className="relative w-full bg-gradient-to-b from-[#FBF8F3] to-[#F3EBDD] overflow-hidden py-12 md:py-20 lg:py-24">
        {/* Kilau Mutiara (Radial-gradient putih 60% di sudut kanan atas) */}
        <div
          className="absolute -top-12 -right-12 w-[380px] sm:w-[560px] h-[380px] sm:h-[560px] pointer-events-none select-none z-0 bg-[radial-gradient(circle_at_100%_0%,rgba(255,255,255,0.6)_0%,transparent_65%)]"
          aria-hidden="true"
        />

        {/* Grain Halus Inline (Hero) - Matikan di mobile < 640px */}
        <SubtleGrain id="grain-hero" />

        {/* Bola Mutiara Dekoratif (Maksimal 2: 1 di mobile, 2 di tablet/desktop) */}
        <PearlOrb className="-top-10 -left-10" size={280} opacity={0.3} />
        <PearlOrb className="bottom-4 right-1/4 hidden sm:block" size={220} opacity={0.25} />

        <div className="relative z-10 w-full max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
            {/* Kolom Kiri: Teks & Aksi (Teks Navy #12263A) */}
            <div className="lg:col-span-7 flex flex-col items-start gap-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12263A] text-[#D9B877] border border-[#D9B877]/40 shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#D9B877]" />
                <span className="text-[11.5px] uppercase tracking-[0.18em] font-semibold">
                  Lombok South Sea Pearls • Kemewahan Alami Kelas Dunia
                </span>
              </div>

              <h1 className="font-serif text-4xl sm:text-5xl lg:text-[62px] font-medium text-[#12263A] leading-[1.08] tracking-tight">
                Kilau Murni Samudera Indonesia dalam Balutan Emas 18K
              </h1>

              <p className="text-[15px] sm:text-[16px] text-[#4A5666] max-w-xl leading-relaxed">
                Mahakarya perhiasan mutiara air laut selatan (<em>Pinctada maxima</em>) asli dari perairan budidaya Sekotong &amp; Medana, Lombok. Dipanen alami dengan kilau cermin abadi (<em>Mirror Luster</em>) dan dirangkai tangan oleh pandai emas terampil menggunakan emas 18K solid bersertifikat lab gemologi resmi.
              </p>

              {/* Tombol Aksi Pil */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('catalog')}
                  className="min-h-[48px] px-8 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all duration-300 text-sm font-semibold inline-flex items-center gap-2.5 cursor-pointer shadow-md hover:-translate-y-0.5"
                >
                  <span>Lihat Koleksi Perhiasan</span>
                  <ArrowRight className="w-4 h-4 text-[#D9B877]" />
                </button>

                <a
                  href="https://wa.me/6281239001122?text=Halo%20Atelier%20CDE%20Pearls,%20saya%20ingin%20konsultasi%20pemilihan%20mutiara"
                  target="_blank"
                  rel="noreferrer"
                  className="min-h-[48px] px-7 rounded-full border border-[#12263A] text-[#12263A] hover:bg-[#12263A]/5 active:scale-95 transition-all duration-300 text-sm font-semibold inline-flex items-center gap-2 cursor-pointer hover:-translate-y-0.5"
                >
                  <MessageCircle className="w-4 h-4 text-[#8A6A2F]" />
                  <span>Konsultasi Private WhatsApp</span>
                </a>
              </div>

              {/* Penanda Keunggulan */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 mt-2 border-t border-[#E6DDD0] w-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E6DDD0] flex items-center justify-center shrink-0 shadow-xs">
                    <Award className="w-5 h-5 text-[#8A6A2F]" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#12263A]">Grade AAA South Sea</span>
                    <span className="text-[11px] text-[#4A5666]">Mirror Luster &amp; Nacre Tebal</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E6DDD0] flex items-center justify-center shrink-0 shadow-xs">
                    <ShieldCheck className="w-5 h-5 text-[#8A6A2F]" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#12263A]">100% Asli Lombok</span>
                    <span className="text-[11px] text-[#4A5666]">Garansi Seumur Hidup</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#E6DDD0] flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5 text-[#8A6A2F]" />
                  </div>
                  <div>
                    <span className="block text-xs font-semibold text-[#12263A]">Emas 18K Solid (750)</span>
                    <span className="text-[11px] text-[#4A5666]">Bersertifikat Gemologi</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom Kanan: Foto Pahlawan dalam Bingkai Bulat (Circular Luxury Frame) */}
            <div className="lg:col-span-5 flex justify-center lg:justify-end">
              <div className="relative w-[300px] h-[300px] sm:w-[420px] sm:h-[420px] lg:w-[460px] lg:h-[460px] rounded-full p-2.5 sm:p-3 bg-white/90 border-4 border-white shadow-2xl group">
                {/* Circular image clipping */}
                <div className="w-full h-full rounded-full overflow-hidden relative bg-[#EDE6DA]">
                  <picture className="w-full h-full block">
                    <source type="image/webp" srcSet="/images/hero_pearl_shell.webp" />
                    <img
                      src="/images/hero_pearl_shell.jpg"
                      alt="Mahakarya Mutiara Laut Selatan Sekotong &amp; Medana Lombok"
                      width={460}
                      height={460}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-106"
                      fetchPriority="high"
                      decoding="async"
                    />
                  </picture>
                  {/* Subtle inner shadow overlay */}
                  <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-black/10 pointer-events-none" />
                </div>

                {/* Floating Certificate Badge */}
                <div className="absolute -bottom-2 sm:bottom-3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-md px-4 py-1.5 rounded-full border border-[#E6DDD0] shadow-lg flex items-center gap-2 whitespace-nowrap z-20">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-semibold text-[#12263A]">Sertifikat lab gemologi resmi</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pemisah Garis Emas Tipis */}
      <GoldLineDivider />

      {/* ========================================================
          2. MARQUEE VARIETAS MUTIARA SAMUDERA
         ======================================================== */}
      <div className="w-full bg-[#FBF8F3]">
        <PearlVarietiesMarquee
          onSelectVariety={(_varietyId) => onNavigate('catalog')}
        />
      </div>

      {/* Pemisah Garis Emas Tipis */}
      <GoldLineDivider />

      {/* ========================================================
          3. KATEGORI PERHIASAN (LATAR PUTIH #FFFFFF)
         ======================================================== */}
      <section className="w-full bg-white py-14 lg:py-18 relative">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[12px] uppercase tracking-[0.18em] font-semibold text-[#8A6A2F] block mb-1">
              Katalog Atelier
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[40px] font-medium text-[#12263A]">
              Eksplorasi Menurut Kategori
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5666] mt-2">
              Dari untaian kalung megah hingga butiran mutiara lepas bersertifikat untuk investasi.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {categories.map((cat) => {
              const isSelected = selectedCategorySlug === cat.slug;
              const hasImage = Boolean(cat.image);

              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigate('catalog', cat.slug)}
                  className={`group relative rounded-2xl overflow-hidden border cursor-pointer transition-all duration-300 hover:-translate-y-2 hover:shadow-xl bg-[#FBF8F3] flex flex-col justify-between ${
                    isSelected ? 'border-[#8A6A2F] ring-2 ring-[#8A6A2F]/30' : 'border-[#E6DDD0]'
                  }`}
                >
                  {hasImage ? (
                    /* Visual Image Container with WebP Picture */
                    <div className="relative w-full h-[180px] sm:h-[190px] overflow-hidden bg-[#EDE6DA]">
                      <picture className="w-full h-full block">
                        {cat.webp_url && <source type="image/webp" srcSet={resolveMediaUrl(cat.webp_url)} />}
                        <img
                          src={resolveMediaUrl(cat.image!)}
                          alt={`Kategori Perhiasan ${cat.name}`}
                          width={240}
                          height={190}
                          className="w-full h-full object-cover aspect-[4/3] transition-transform duration-700 ease-out group-hover:scale-108"
                          loading="lazy"
                          decoding="async"
                          style={{ contentVisibility: 'auto' }}
                        />
                      </picture>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#12263A]/85 text-[#D9B877] backdrop-blur-xs">
                        {cat.productsCount} Koleksi
                      </span>
                    </div>
                  ) : null}

                  {/* Card Text Info */}
                  <div className={`p-4 flex-1 flex flex-col justify-between text-left ${!hasImage ? 'min-h-[160px]' : ''}`}>
                    <div>
                      {!hasImage && (
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] uppercase tracking-wider font-semibold text-[#8A6A2F]">
                            Koleksi Mutiara
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#12263A]/10 text-[#12263A]">
                            {cat.productsCount} Koleksi
                          </span>
                        </div>
                      )}
                      <h3 className="font-serif text-xl font-medium text-[#12263A] group-hover:text-[#8A6A2F] transition-colors leading-snug">
                        {cat.name}
                      </h3>
                      <p className="text-[12px] text-[#4A5666] mt-1 line-clamp-2">
                        {cat.subtitle || 'Koleksi perhiasan mutiara air laut lombok bersertifikat.'}
                      </p>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-[#E6DDD0]/60 flex items-center justify-between text-xs font-semibold text-[#8A6A2F]">
                      <span>Jelajahi Koleksi</span>
                      <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pemisah Garis Emas Tipis */}
      <GoldLineDivider />

      {/* ========================================================
          4. ETALASE UTAMA (KATALOG DENGAN LATAR IVORY #FBF8F3)
         ======================================================== */}
      <section id="katalog-section" className="w-full bg-[#FBF8F3] py-14 scroll-mt-20 relative">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[12px] uppercase tracking-[0.18em] font-semibold text-[#8A6A2F] block mb-1">
                Etalase Pilihan
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#12263A]">
                Koleksi Mahakarya Terkini
              </h2>
            </div>

            {/* Chip Filter Kategori */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedCategorySlug('all')}
                className={`min-h-[40px] px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedCategorySlug === 'all'
                    ? 'bg-[#12263A] text-white shadow-xs'
                    : 'bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#EDE6DA]'
                }`}
              >
                Semua Koleksi ({liveProducts.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCategorySlug(c.slug)}
                  className={`min-h-[40px] px-4 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    selectedCategorySlug === c.slug
                      ? 'bg-[#12263A] text-white shadow-xs'
                      : 'bg-white border border-[#E6DDD0] text-[#4A5666] hover:bg-[#EDE6DA]'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Baris Filter Varietas & Grade */}
          <div className="bg-white border border-[#E6DDD0] rounded-2xl p-4 mb-8 flex flex-wrap items-center justify-between gap-3 text-xs shadow-xs">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-semibold text-[#12263A] uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-[#8A6A2F]" />
                Filter Gemologi:
              </span>

              {/* Varietas */}
              <select
                aria-label="Pilih varietas mutiara laut"
                value={varietyFilter}
                onChange={(e) => setVarietyFilter(e.target.value)}
                className="min-h-[38px] px-3 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] text-[#12263A] focus:outline-none focus:border-[#8A6A2F] cursor-pointer"
              >
                <option value="all">Semua Varietas</option>
                <option value="South Sea Pearl">South Sea White Pearl</option>
                <option value="Golden South Sea">Golden South Sea Pearl</option>
                <option value="Tahitian Black Pearl">Tahitian Peacock Black Pearl</option>
              </select>

              {/* Grade */}
              <select
                aria-label="Pilih grade mutiara"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="min-h-[38px] px-3 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] text-[#12263A] focus:outline-none focus:border-[#8A6A2F] cursor-pointer"
              >
                <option value="all">Semua Grade</option>
                <option value="AAA">Grade AAA (Mirror Luster)</option>
                <option value="AA+">Grade AA+ (High Luster)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#4A5666]">Urutkan:</span>
              <select
                aria-label="Pilih urutan perhiasan"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="min-h-[38px] px-3 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] text-[#12263A] font-medium focus:outline-none focus:border-[#8A6A2F] cursor-pointer"
              >
                <option value="featured">Koleksi Unggulan</option>
                <option value="price-low">Harga: Terendah ke Tertinggi</option>
                <option value="price-high">Harga: Tertinggi ke Terendah</option>
                <option value="newest">Desain Terbaru</option>
              </select>
            </div>
          </div>

          {/* Product Cards Grid / Loading / Error / Empty State */}
          {isLoading ? (
            <div className="p-16 text-center space-y-4">
              <div className="w-8 h-8 border-2 border-[#8A6A2F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[#4A5666]">Menyelaraskan koleksi mutiara pilihan...</p>
            </div>
          ) : isError ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-red-200 space-y-3">
              <p className="text-sm text-red-600 font-medium">
                Gagal memuat katalog perhiasan. Periksa koneksi internet Anda.
              </p>
              <button
                type="button"
                onClick={fetchCatalogData}
                className="px-6 py-2 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : liveProducts.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-[#E6DDD0] space-y-3">
              <Sparkles className="w-10 h-10 text-[#8A6A2F] mx-auto opacity-70" />
              <h3 className="font-serif text-2xl font-medium text-[#12263A]">
                Koleksi Segera Hadir
              </h3>
              <p className="text-sm text-[#4A5666] max-w-md mx-auto">
                Atelier perhiasan mutiara air laut Lombok kami sedang menyiapkan koleksi istimewa untuk Anda.
              </p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredProducts.map((p) => (
                <ProductCard
                  key={p.id}
                  id={p.id}
                  name={p.name}
                  category={p.category}
                  variety={p.variety}
                  grade={p.grade}
                  pearlSize={p.pearlSize}
                  metal={p.metal}
                  price={p.price}
                  formattedPrice={p.formattedPrice}
                  image={resolveMediaUrl(p.image)}
                  onAddToCart={() => {
                    addToCart(p);
                    onAddToCart(p.name);
                  }}
                  onToggleWishlist={() => toggleWishlist(p)}
                  isWishlisted={isInWishlist(p.id)}
                  onSelect={() => onSelectProduct && onSelectProduct(p)}
                />
              ))}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-2xl border border-[#E6DDD0]">
              <p className="text-sm text-[#4A5666]">
                Tidak ada perhiasan yang sesuai dengan filter yang dipilih.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategorySlug('all');
                  setVarietyFilter('all');
                  setGradeFilter('all');
                }}
                className="mt-4 px-6 py-2 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] cursor-pointer"
              >
                Reset Semua Filter
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ========================================================
          PEMISAH GELOMBANG DI ATAS BAGIAN NAVY
          Berwarna bagian sebelumnya: Ivory (#FBF8F3)
         ======================================================== */}
      <WaveDivider fillColor="#FBF8F3" />

      {/* ========================================================
          5. ATELIER CRAFTSMANSHIP & TERROIR SEKOTONG & MEDANA LOMBOK
          Latar: Foto hero_pearl_bg.jpg (WebP) dengan overlay linear-gradient navy 85% kiri ke 35% kanan
          Teks: Putih (#FFFFFF)
          Data: data-dark-section="true" agar header otomatis putih saat scroll di atasnya
         ======================================================== */}
      <section
        data-dark-section="true"
        className="relative w-full text-white py-16 lg:py-24 overflow-hidden"
      >
        {/* Background Photo dengan WebP <picture> dan Overlay 85% kiri ke 35% kanan */}
        <div className="absolute inset-0 z-0">
          <picture className="w-full h-full block">
            <source type="image/webp" srcSet="/images/hero_pearl_bg.webp" />
            <img
              src="/images/hero_pearl_bg.jpg"
              alt="Perairan Budidaya Mutiara Sekotong dan Medana Lombok"
              width={1600}
              height={900}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
              style={{ contentVisibility: 'auto' }}
            />
          </picture>
          {/* Overlay Linear Gradient: Navy 85% kiri ke 35% kanan */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#12263A]/90 via-[#12263A]/75 to-[#12263A]/45 sm:from-[#12263A]/85 sm:to-[#12263A]/35 pointer-events-none"
            aria-hidden="true"
          />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left Photo Feature */}
            <div className="lg:col-span-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl overflow-hidden border border-[#D9B877]/40 shadow-xl bg-black/30">
                <picture className="w-full h-full block">
                  <source type="image/webp" srcSet="/images/terroir_pearl_plate_left.webp" />
                  <img
                    src="/images/terroir_pearl_plate_left.jpg"
                    alt="Pendant Mutiara Emas South Sea Sekotong &amp; Medana"
                    width={300}
                    height={320}
                    className="w-full h-[260px] sm:h-[320px] object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    style={{ contentVisibility: 'auto' }}
                  />
                </picture>
              </div>
              <div className="rounded-2xl overflow-hidden border border-[#D9B877]/40 shadow-xl mt-6 bg-black/30">
                <picture className="w-full h-full block">
                  <source type="image/webp" srcSet="/images/featured_pearl_dark_luxury.webp" />
                  <img
                    src="/images/featured_pearl_dark_luxury.jpg"
                    alt="Cincin Solitaire Mutiara Emas 18K"
                    width={300}
                    height={320}
                    className="w-full h-[260px] sm:h-[320px] object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    decoding="async"
                    style={{ contentVisibility: 'auto' }}
                  />
                </picture>
              </div>
            </div>

            {/* Right Story Info (Teks Putih) */}
            <div className="lg:col-span-6 flex flex-col items-start gap-5">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D9B877]/20 border border-[#D9B877]/50 text-[#D9B877]">
                <Compass className="w-3.5 h-3.5" />
                <span className="text-[11px] uppercase tracking-[0.2em] font-semibold">
                  Terroir Sekotong &amp; Medana • Lombok
                </span>
              </div>

              <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-tight">
                Keajaiban Tiram Emas di Kedalaman Samudera Tropis
              </h2>

              <p className="text-[15px] text-white/90 leading-relaxed">
                Perairan Sekotong &amp; Medana di Lombok terkenal secara global karena memiliki arus laut kaya plankton, suhu stabil, dan kejernihan air yang luar biasa. Di sinilah tiram raksasa <em>Pinctada maxima</em> dirawat secara etis selama 24 hingga 36 bulan untuk menghasilkan lapisan nacre tebal dengan kilau cermin alami yang abadi.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-2 w-full">
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
                  <span className="text-2xl font-serif font-bold text-[#D9B877] block">100%</span>
                  <span className="text-xs text-white/90">Organik Bebas Pewarna Kimiawi</span>
                </div>
                <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20">
                  <span className="text-2xl font-serif font-bold text-[#D9B877] block">Au 750</span>
                  <span className="text-xs text-white/90">Rangka Emas 18K Solid Buatan Tangan</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('about')}
                className="mt-2 min-h-[46px] px-7 rounded-full bg-[#D9B877] text-[#12263A] hover:bg-[#e4ca93] font-semibold text-xs inline-flex items-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <span>Pelajari Warisan Atelier CD'E</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pemisah Garis Emas Tipis */}
      <GoldLineDivider />

      {/* ========================================================
          6. STANDAR KEUNGGULAN (LATAR CHAMPAGNE #F3EBDD)
         ======================================================== */}
      <section className="w-full bg-[#F3EBDD] py-16 lg:py-20 border-b border-[#E6DDD0]">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[12px] uppercase tracking-[0.18em] font-semibold text-[#8A6A2F] block mb-1">
              Standar Keunggulan Atelier
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#12263A]">
              Mengapa Memilih CD'E Pearls
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Mutiara Laut Asli Lombok',
                desc: 'Dipanen dari tiram Pinctada maxima di perairan alami Sekotong & Medana, Lombok tanpa suntikan zat pewarna kimiawi.',
              },
              {
                title: 'Emas 18K & Perak 925 Solid',
                desc: 'Rangka dudukan cincin, anting, dan pengait kalung dibuat presisi dengan kadar emas 750 (18K) dan perak sterling 925.',
              },
              {
                title: 'Sertifikat lab gemologi',
                desc: 'Setiap butir mutiara disertai sertifikat resmi pengujian laboratorium independen yang mencantumkan grade spesifik.',
              },
              {
                title: 'Pengiriman Berasuransi Penuh',
                desc: 'Pengiriman berasuransi 100% ke seluruh nusantara dengan segel keamanan tamper-evident dan kotak beludru premium.',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="relative pt-6 flex flex-col items-start bg-white/95 backdrop-blur-xs p-6 rounded-2xl border border-[#E6DDD0] shadow-xs"
              >
                <div className="absolute top-0 left-6 w-16 h-[3px] bg-[#8A6A2F]" />
                <span className="font-serif text-xl font-bold text-[#8A6A2F] mb-1">
                  0{idx + 1}
                </span>
                <h3 className="font-serif text-xl font-semibold text-[#12263A] mb-2">
                  {item.title}
                </h3>
                <p className="text-[13.5px] text-[#4A5666] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pemisah Garis Emas Tipis */}
      <GoldLineDivider />

      {/* ========================================================
          7. EDUKASI MUTIARA LAUT SELATAN (LATAR BLUSH #F1E4DC)
          Dengan 2 bola mutiara dekoratif
         ======================================================== */}
      <section className="relative w-full bg-[#F1E4DC] py-16 lg:py-20 border-b border-[#E6DDD0] overflow-hidden">
        {/* 2 Bola Mutiara Dekoratif (1 di mobile, 2 di tablet/desktop) */}
        <PearlOrb className="-top-12 -right-12" size={340} opacity={0.32} />
        <PearlOrb className="bottom-0 -left-12 hidden sm:block" size={260} opacity={0.28} />

        <div className="relative z-10 max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[12px] uppercase tracking-[0.18em] font-semibold text-[#8A6A2F] block mb-1">
              Panduan Gemologi
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#12263A]">
              Edukasi Mutiara Laut Selatan
            </h2>
            <p className="text-xs sm:text-sm text-[#4A5666] mt-2">
              Kriteria penentu kualitas dan kilau abadi perhiasan mutiara air laut.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'Mirror Luster (Kilau Cermin)',
                label: 'Kualitas Kilau Reflektif',
                desc: 'Mutiara laut berkualitas tinggi memiliki kilau cermin tajam. Bila Anda mendekatkan wajah, pantulan bayangan terlihat jelas di permukaannya tanpa distorsi buram.',
                imgWebp: '/images/hero_pearl_shell.webp',
                imgJpg: '/images/hero_pearl_shell.jpg',
              },
              {
                title: 'Ketebalan Nacre (>2.0mm)',
                label: 'Lapisan Kristal Alami',
                desc: 'Nacre yang tebal tercipta setelah 24 hingga 36 bulan masa pemeliharaan etis di kedalaman laut Lombok, menjamin warna mutiara tidak akan pernah pudar seumur hidup.',
                imgWebp: '/images/hero_pearl_dark_luxury.webp',
                imgJpg: '/images/hero_pearl_dark_luxury.jpg',
              },
              {
                title: 'Perawatan & Kilau Abadi',
                label: 'Panduan Konservasi Perhiasan',
                desc: 'Mutiara adalah perhiasan organik. Kenakan mutiara setelah parfum dan riasan kering, lalu bersihkan dengan kain katun halus setiap selesai digunakan.',
                imgWebp: '/images/terroir_pearl_plate_left.webp',
                imgJpg: '/images/terroir_pearl_plate_left.jpg',
              },
            ].map((edu, idx) => (
              <div
                key={idx}
                className="bg-white/95 backdrop-blur-xs border border-[#E6DDD0] rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="w-full h-[180px] overflow-hidden bg-[#EDE6DA]">
                    <picture className="w-full h-full block">
                      <source type="image/webp" srcSet={edu.imgWebp} />
                      <img
                        src={edu.imgJpg}
                        alt={edu.title}
                        width={380}
                        height={180}
                        className="w-full h-full object-cover aspect-[16/9] hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        decoding="async"
                        style={{ contentVisibility: 'auto' }}
                      />
                    </picture>
                  </div>

                  <div className="p-6">
                    <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] block">
                      {edu.label}
                    </span>
                    <h3 className="font-serif text-2xl font-medium text-[#12263A] mt-1 mb-2">
                      {edu.title}
                    </h3>
                    <p className="text-[13.5px] text-[#4A5666] leading-relaxed">
                      {edu.desc}
                    </p>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-[#E6DDD0]/60 mt-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('education')}
                    className="text-xs font-semibold text-[#12263A] hover:text-[#8A6A2F] inline-flex items-center gap-1.5 cursor-pointer pt-3"
                  >
                    <span>Pelajari Selengkapnya</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          8. TESTIMONI & APRESIASI KOLEKTOR (LATAR PUTIH #FFFFFF)
         ======================================================== */}
      <section className="w-full bg-white py-16 lg:py-20 relative">
        <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[12px] uppercase tracking-[0.18em] font-semibold text-[#8A6A2F] block mb-1">
              Pengalaman Kolektor
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-medium text-[#12263A]">
              Apresiasi Pelanggan Setia
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  '“Kilau mutiara South Sea dari CD\'E Pearls benar-benar luar biasa. Saat saya bawa ke gemologist di Jakarta, mereka mengakui nacre dan luster-nya berada di kelas teratas.”',
                name: 'Siti Rahmawati',
                initials: 'SR',
                role: 'Kolektor Perhiasan, Jakarta Selatan',
              },
              {
                quote:
                  '“Pelayanan private concierge via WhatsApp sangat responsif dan edukatif. Gelang rantai emas 18K mutiara emas sampai dalam kotak beludru cantik dengan sertifikat lengkap.”',
                name: 'Raden Ayu Kartika',
                initials: 'RK',
                role: 'Surabaya Barat',
              },
              {
                quote:
                  '“Saya memesan anting mutiara stud untuk kado ulang tahun pernikahan. Kualitas mutiara bulat sempurna dan pengiriman berasuransi membuat saya sangat tenang.”',
                name: 'Bambang Soediro',
                initials: 'BS',
                role: 'Bandung',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-[#FBF8F3] border border-[#E6DDD0] rounded-2xl p-6 lg:p-7 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <p className="font-serif italic text-[15.5px] text-[#12263A] leading-relaxed">
                    {item.quote}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E6DDD0] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#12263A] text-[#D9B877] font-serif font-semibold text-sm flex items-center justify-center shrink-0 border border-[#D9B877]/30 shadow-xs">
                    {item.initials}
                  </div>
                  <div>
                    <h4 className="font-semibold text-xs text-[#12263A]">{item.name}</h4>
                    <span className="text-[11px] text-[#4A5666]">{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================
          PEMISAH GELOMBANG DI ATAS BAGIAN AJAKAN KONSULTASI
          Berwarna bagian sebelumnya: Putih (#FFFFFF)
         ======================================================== */}
      <WaveDivider fillColor="#FFFFFF" />

      {/* ========================================================
          9. AJAKAN KONSULTASI (GRADIEN NAVY KE OCEAN DENGAN GARIS EMAS TIPIS)
          Latar: Gradien navy (#12263A) ke ocean (#1B3A57)
          Garis emas tipis: border-t border-[#D9B877]/35
          Grain halus: SVG feTurbulence inline opacity 0.04
          Data: data-dark-section="true" agar header otomatis putih
         ======================================================== */}
      <section
        data-dark-section="true"
        className="relative w-full bg-gradient-to-r from-[#12263A] via-[#163048] to-[#1B3A57] text-white py-16 px-4 sm:px-6 lg:px-8 border-t border-[#D9B877]/35 overflow-hidden"
      >
        {/* Grain Halus Inline (CTA) - Matikan di mobile < 640px */}
        <SubtleGrain id="grain-cta" />

        <div className="relative z-10 max-w-[1000px] mx-auto text-center flex flex-col items-center gap-5">
          <span className="text-[12px] uppercase tracking-[0.2em] font-semibold text-[#D9B877]">
            Private Concierge &amp; Gemologist
          </span>

          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-medium text-white leading-tight">
            Butuh Panduan Memilih Mutiara Sempurna?
          </h2>

          <p className="text-[15px] text-white/90 max-w-xl leading-relaxed">
            Setiap mutiara memiliki karakter kilau, nuansa warna (overtone), dan ukuran yang unik. Gemologist atelier kami siap membantu Anda memilih mahakarya yang paling sesuai dengan selera pribadi.
          </p>

          <a
            href="https://wa.me/6281239001122?text=Halo%20Concierge%20CDE%20Pearls,%20saya%20ingin%20berkonsultasi%20mengenai%20koleksi%20mutiara"
            target="_blank"
            rel="noreferrer"
            className="mt-2 min-h-[48px] px-8 rounded-full bg-[#D9B877] text-[#12263A] hover:bg-[#e4ca93] active:scale-95 transition-all text-sm font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Hubungi via WhatsApp</span>
          </a>
        </div>
      </section>
      </div>
    </div>
  );
};
