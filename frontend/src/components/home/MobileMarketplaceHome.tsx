import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '../ui/carousel';
import { ProductCard } from '../common/ProductCard';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  Award,
  ArrowRight,
} from 'lucide-react';
import { mockProducts, type MockProduct } from '../../data/mock';
import { usePrefersReducedMotion } from '../../lib/motion';

interface MobileMarketplaceHomeProps {
  onSelectProduct: (p: MockProduct) => void;
  onAddToCart: (name: string) => void;
}

export const MobileMarketplaceHome: React.FC<MobileMarketplaceHomeProps> = ({
  onSelectProduct,
  onAddToCart,
}) => {
  const navigate = useNavigate();
  const prefersReduced = usePrefersReducedMotion();
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // 1. Banner Data (Maksimal 3 Slide, Judul max 6 kata, Tombol max 2 kata)
  const bannerSlides = [
    {
      image: '/images/hero_pearl_bg.jpg',
      title: 'Mutiara Air Laut Asli Lombok',
      subtitle: 'Grade AAA Solid Emas 18K',
      cta: 'Lihat Koleksi',
      action: () => navigate('/katalog'),
    },
    {
      image: '/images/hero_pearl_dark_luxury.jpg',
      title: 'Kemewahan Alami Samudera Indonesia',
      subtitle: 'Kilau Cermin Mirror Luster',
      cta: 'Jelajahi Atelier',
      action: () => navigate('/katalog?variety=South%20Sea%20Pearl'),
    },
    {
      image: '/images/hero_pearl_shell.jpg',
      title: 'Desain Kustom Studio 3D',
      subtitle: 'Pilih Mutiara & Rangka Emas',
      cta: 'Buka Studio',
      action: () => navigate('/studio'),
    },
  ];

  // Carousel Autoplay (5 Detik, Pause saat disentuh atau reduced motion)
  useEffect(() => {
    if (!carouselApi || prefersReduced || isPaused) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselApi, prefersReduced, isPaused]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    carouselApi.on('select', onSelect);
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  // 2. Baris Ikon Kategori (5 Kategori, Foto Bulat 56px, Label 1 Kata)
  const categoryIcons = [
    { slug: 'kalung', name: 'Kalung', image: '/images/hero_pearl_shell.jpg' },
    { slug: 'cincin', name: 'Cincin', image: '/images/cat_ring_silk.jpg' },
    { slug: 'anting', name: 'Anting', image: '/images/terroir_pearl_plate_left.jpg' },
    { slug: 'gelang', name: 'Gelang', image: '/images/placeholder_jewelry.svg' },
    { slug: 'bros', name: 'Bros', image: '/images/placeholder_jewelry.svg' },
  ];

  // 4. Produk Terbaru (6 Produk)
  const latestProducts = mockProducts.slice(0, 6);

  // 5. Produk Terlaris (Hanya jika ada data terjual nyata)
  const bestSellerProducts = mockProducts
    .filter((p) => typeof p.id === 'number' && p.id % 2 === 1)
    .slice(0, 6);

  return (
    <div data-slot="mobile-marketplace-home" className="w-full flex flex-col gap-5 px-3 py-3 bg-[var(--bg)] font-sans select-none pb-12">
      {/* ========================================================
          1. BANNER FOTO LEBAR PENUH (Carousel shadcn, max 3 slide)
         ======================================================== */}
      <div
        className="relative w-full rounded-2xl overflow-hidden shadow-xs bg-[#12263A] animate-banner-load"
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <Carousel setApi={setCarouselApi} opts={{ loop: true }}>
          <CarouselContent className="-ml-0">
            {bannerSlides.map((slide, idx) => (
              <CarouselItem key={idx} className="pl-0 basis-full">
                <div className="relative w-full h-[200px] sm:h-[240px] overflow-hidden flex items-end p-4">
                  {/* Background Image */}
                  <img
                    src={slide.image}
                    alt={slide.title}
                    width={480}
                    height={240}
                    className="absolute inset-0 w-full h-full object-cover"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                  {/* Navy gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#12263A]/90 via-[#12263A]/40 to-transparent pointer-events-none" />

                  {/* Content (Judul max 6 kata, Tombol max 2 kata) */}
                  <div className="relative z-10 w-full space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#D9B877] block">
                      {slide.subtitle}
                    </span>
                    <h2 className="font-serif text-lg font-bold text-white leading-tight drop-shadow-xs max-w-[280px]">
                      {slide.title}
                    </h2>
                    <button
                      type="button"
                      onClick={slide.action}
                      className="min-h-[44px] px-4 rounded-full bg-[#D9B877] text-[#12263A] hover:bg-white text-xs font-bold transition-transform active:scale-95 touch-feedback inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <span>{slide.cta}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Titik Indikator Slide */}
        <div className="absolute bottom-2.5 right-4 z-10 flex items-center gap-1.5">
          {bannerSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => carouselApi?.scrollTo(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                currentSlide === i ? 'w-5 bg-[#D9B877]' : 'w-1.5 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ========================================================
          2. BARIS IKON KATEGORI (Bulat 56px, Snap Scroll Horizontal)
         ======================================================== */}
      <div>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-[12px] font-bold text-[var(--text)] uppercase tracking-wider">
            Kategori Perhiasan
          </span>
          <button
            type="button"
            onClick={() => navigate('/katalog')}
            className="text-[11px] text-[#8A6A2F] dark:text-[#D9B877] font-semibold hover:underline"
          >
            Lihat Semua
          </button>
        </div>
        <div className="flex items-center gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar py-1">
          {categoryIcons.map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => navigate(`/katalog?category=${cat.slug}`)}
              className="flex flex-col items-center gap-1.5 shrink-0 snap-start touch-feedback cursor-pointer group"
            >
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[var(--border)] group-hover:border-[#8A6A2F] dark:group-hover:border-[#D9B877] p-0.5 bg-[var(--surface)] shadow-2xs transition-colors">
                <img
                  src={cat.image}
                  alt={cat.name}
                  width={56}
                  height={56}
                  className="w-full h-full object-cover rounded-full"
                  loading="lazy"
                />
              </div>
              <span className="text-[11px] font-medium text-[var(--text)] truncate max-w-[64px] text-center">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================================
          3. BARIS CHIP JALAN PINTAS (Studio 3D, Cek Sertifikat, Lacak)
         ======================================================== */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => navigate('/studio')}
          className="min-h-[44px] p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] flex items-center justify-center gap-1.5 text-xs font-semibold touch-feedback shadow-2xs hover:border-[#8A6A2F]"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
          <span className="truncate">Studio 3D</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/cek-sertifikat')}
          className="min-h-[44px] p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] flex items-center justify-center gap-1.5 text-xs font-semibold touch-feedback shadow-2xs hover:border-[#8A6A2F]"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
          <span className="truncate">Sertifikat</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/lacak-pesanan')}
          className="min-h-[44px] p-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--text)] flex items-center justify-center gap-1.5 text-xs font-semibold touch-feedback shadow-2xs hover:border-[#8A6A2F]"
        >
          <Truck className="w-3.5 h-3.5 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
          <span className="truncate">Lacak</span>
        </button>
      </div>

      {/* ========================================================
          4. KOLEKSI TERBARU (Judul max 2 kata + 2 Kolom Grid)
         ======================================================== */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-serif text-base font-bold text-[var(--text)]">
            Koleksi Terbaru
          </h2>
          <button
            type="button"
            onClick={() => navigate('/katalog')}
            className="text-[11px] text-[#8A6A2F] dark:text-[#D9B877] font-semibold hover:underline"
          >
            Lihat semua
          </button>
        </div>

        {/* 2 Kolom Grid pada Mobile (Gap 8px) */}
        <div className="grid grid-cols-2 gap-2">
          {latestProducts.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              category={p.category}
              variety={p.variety}
              grade={p.grade}
              price={p.price}
              formattedPrice={p.formattedPrice}
              image={p.image}
              rating={4.9}
              soldCount={12}
              onAddToCart={() => onAddToCart(p.name)}
              onSelect={() => onSelectProduct(p)}
            />
          ))}
        </div>
      </div>

      {/* ========================================================
          5. PRODUK TERLARIS (Hanya bila ada data nyata)
         ======================================================== */}
      {bestSellerProducts.length > 0 && (
        <div className="space-y-2.5 pt-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-serif text-base font-bold text-[var(--text)]">
              Paling Diminati
            </h2>
            <button
              type="button"
              onClick={() => navigate('/katalog?sort=bestseller')}
              className="text-[11px] text-[#8A6A2F] dark:text-[#D9B877] font-semibold hover:underline"
            >
              Lihat semua
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {bestSellerProducts.map((p) => (
              <ProductCard
                key={`best-${p.id}`}
                id={p.id}
                name={p.name}
                category={p.category}
                variety={p.variety}
                grade={p.grade}
                price={p.price}
                formattedPrice={p.formattedPrice}
                image={p.image}
                rating={5.0}
                soldCount={28}
                onAddToCart={() => onAddToCart(p.name)}
                onSelect={() => onSelectProduct(p)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          6. STRIP KEPERCAYAAN (3 Ikon + 2 Kata per butir)
         ======================================================== */}
      <div className="grid grid-cols-3 gap-2 py-3 px-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] shadow-2xs">
        <div className="flex flex-col items-center text-center gap-1">
          <Award className="w-5 h-5 text-[#8A6A2F] dark:text-[#D9B877]" />
          <span className="text-[11px] font-bold text-[var(--text)]">Asli Lombok</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1 border-x border-[var(--border)] px-1">
          <Sparkles className="w-5 h-5 text-[#8A6A2F] dark:text-[#D9B877]" />
          <span className="text-[11px] font-bold text-[var(--text)]">Emas 18K</span>
        </div>
        <div className="flex flex-col items-center text-center gap-1">
          <ShieldCheck className="w-5 h-5 text-[#8A6A2F] dark:text-[#D9B877]" />
          <span className="text-[11px] font-bold text-[var(--text)]">Sertifikat Lab</span>
        </div>
      </div>
    </div>
  );
};
