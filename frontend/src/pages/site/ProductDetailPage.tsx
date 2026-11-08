import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { catalogApi } from '../../lib/api';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { resolveMediaUrl, resolveWebpUrl } from '../../lib/media';
import {
  ShieldCheck,
  Heart,
  ShoppingBag,
  MessageCircle,
  ArrowLeft,
  Sparkles,
  Clock,
  Truck,
  ZoomIn,
  ChevronRight,
} from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '../../components/ui/carousel';
import {
  Dialog,
  DialogContent,
} from '../../components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../../components/ui/accordion';
import { ProductCard } from '../../components/common/ProductCard';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNotFound, setIsNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isVariantSheetOpen, setIsVariantSheetOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Variant States
  const [selectedSize, setSelectedSize] = useState<string>('11–12 mm');
  const [selectedColor, setSelectedColor] = useState<string>('Silver White');
  const [selectedMetal, setSelectedMetal] = useState<string>('Emas Kuning 18K');

  const fetchProductDetail = () => {
    if (!id) return;
    setIsLoading(true);
    setIsNotFound(false);
    setError(null);

    catalogApi
      .getProduct(id)
      .then((res: any) => {
        const item = res?.data || res;
        if (item && item.id) {
          setProduct(item);
          setSelectedImage(resolveMediaUrl(item.image, '/images/hero_pearl_shell.jpg'));
          if (item.metal) setSelectedMetal(item.metal);
          document.title = `${item.name} | CD'E Pearls Lombok`;

          // Muat produk terkait dari API resmi
          catalogApi
            .getProducts({ per_page: 6 })
            .then((pRes: any) => {
              const pItems = pRes?.data || pRes;
              if (Array.isArray(pItems)) {
                setRelatedProducts(
                  pItems.filter((p: any) => String(p.id) !== String(item.id)).slice(0, 4)
                );
              }
            })
            .catch(() => {});
        } else {
          setIsNotFound(true);
        }
      })
      .catch((err: any) => {
        if (err?.response?.status === 404) {
          setIsNotFound(true);
        } else {
          setError('Gagal memuat detail perhiasan mutiara. Periksa koneksi internet Anda.');
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchProductDetail();
  }, [id]);

  // Track Carousel Slide
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

  if (isLoading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-16 text-center font-sans">
        <div className="w-8 h-8 border-2 border-[#8A6A2F] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-xs text-[#4A5666]">Memuat detail koleksi mutiara...</p>
      </div>
    );
  }

  if (isNotFound) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-20 text-center font-sans space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] mx-auto flex items-center justify-center text-[#8A6A2F]">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          Perhiasan Tidak Ditemukan
        </h2>
        <p className="text-sm text-[#4A5666] dark:text-[#A0AEC0] max-w-md mx-auto">
          Koleksi mutiara yang Anda cari tidak tersedia atau belum dipublikasikan ke katalog resmi.
        </p>
        <Link
          to="/katalog"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Katalog</span>
        </Link>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="w-full max-w-[1200px] mx-auto px-4 py-20 text-center font-sans space-y-4">
        <p className="text-sm text-red-600 dark:text-red-400 font-medium">
          {error || 'Terjadi kesalahan saat memuat data produk.'}
        </p>
        <button
          type="button"
          onClick={fetchProductDetail}
          className="px-6 py-2.5 rounded-full bg-[#12263A] text-white text-xs font-semibold hover:bg-[#1A3652] transition-colors cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const isFavorited = isInWishlist(product.id);

  const images: string[] =
    product.images && Array.isArray(product.images) && product.images.length > 0
      ? product.images.map((img: any) => resolveMediaUrl(typeof img === 'string' ? img : img.url, '/images/hero_pearl_shell.jpg'))
      : [resolveMediaUrl(product.image, '/images/hero_pearl_shell.jpg')];

  const handleAddToCartDirect = () => {
    addToCart({
      ...product,
      selectedSize,
      selectedColor,
      selectedMetal,
    });
    toast.success(`✓ ${product.name} berhasil ditambahkan ke keranjang.`);
  };

  const handleBuyNow = () => {
    addToCart({
      ...product,
      selectedSize,
      selectedColor,
      selectedMetal,
    });
    toast.success(`✓ Siap melakukan checkout untuk ${product.name}.`);
    navigate('/checkout');
  };

  return (
    <div className="w-full font-sans">
      {/* ========================================================
          MOBILE VIEW (< lg) - MARKETPLACE STYLE (TAHAP Q6)
         ======================================================== */}
      <div className="lg:hidden w-full flex flex-col pb-24 bg-[var(--bg)]">
        {/* Top Back Navigation Bar */}
        <div className="sticky top-12 z-20 bg-[var(--surface)]/90 backdrop-blur-md px-3.5 py-2.5 border-b border-[var(--border)] flex items-center justify-between">
          <Link
            to="/katalog"
            className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text)] touch-feedback py-1"
          >
            <ArrowLeft className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877]" />
            <span>Katalog</span>
          </Link>
          <span className="text-[11px] font-mono text-[var(--text-2)] uppercase tracking-wider">
            {product.grade ? `Grade ${product.grade}` : 'AAA'}
          </span>
        </div>

        {/* 1. Foto Produk: Rasio 1:1, Carousel shadcn swipe horizontal, "1/5" counter */}
        <div className="relative aspect-square w-full bg-[var(--surface-2)] overflow-hidden">
          <Carousel setApi={setCarouselApi} opts={{ loop: true }} className="w-full h-full">
            <CarouselContent className="-ml-0 h-full">
              {images.map((img, idx) => (
                <CarouselItem key={idx} className="pl-0 basis-full h-full">
                  <div
                    onClick={() => setIsZoomOpen(true)}
                    className="relative w-full h-full cursor-zoom-in"
                  >
                    <img
                      src={img}
                      alt={`${product.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading={idx === 0 ? 'eager' : 'lazy'}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>

          {/* Indikator Angka "1/5" di Pojok Kanan Bawah Foto */}
          <div className="absolute bottom-3 right-3 z-10 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[11px] font-mono font-medium flex items-center gap-1 shadow-xs pointer-events-none">
            <span>{currentSlide + 1}</span>
            <span>/</span>
            <span>{images.length}</span>
            <ZoomIn className="w-3 h-3 ml-0.5 opacity-70" />
          </div>
        </div>

        {/* Dialog Zoom Layar Penuh */}
        <Dialog open={isZoomOpen} onOpenChange={setIsZoomOpen}>
          <DialogContent className="max-w-md bg-black/95 border-none p-3 text-white rounded-3xl">
            <div className="relative aspect-square w-full flex items-center justify-center overflow-hidden rounded-2xl bg-black">
              <img
                src={images[currentSlide]}
                alt={product.name}
                className="w-full h-full object-contain"
              />
            </div>
            <p className="text-center text-xs text-white/70 font-serif pt-2 truncate">
              {product.name} ({currentSlide + 1}/{images.length})
            </p>
          </DialogContent>
        </Dialog>

        {/* 2. Info Ringkas di Bawah Foto: Nama max 2 baris, Harga, Variasi, Stok, Pengiriman */}
        <div className="p-3.5 space-y-3.5 bg-[var(--surface)] border-b border-[var(--border)]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8A6A2F] dark:text-[#D9B877] uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              <span>{typeof product.category === 'object' && product.category !== null ? (product.category as any).name : (product.category || 'Mutiara Laut Selatan')}</span>
            </div>
            <h2 className="font-serif text-lg font-bold text-[var(--text)] leading-snug line-clamp-2">
              {product.name}
            </h2>
            <p className="font-serif text-2xl font-bold text-[#8A6A2F] dark:text-[#D9B877] pt-1">
              Rp {(product.price || 0).toLocaleString('id-ID')}
            </p>
          </div>

          {/* Variasi Chips Singkat (Memicu Sheet bila disentuh) */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)]">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[var(--text)]">Variasi Pilihan</span>
              <button
                type="button"
                onClick={() => setIsVariantSheetOpen(true)}
                className="text-[#8A6A2F] dark:text-[#D9B877] font-semibold text-[11px] flex items-center gap-0.5"
              >
                <span>Ubah</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                {selectedSize}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                {selectedColor}
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                {selectedMetal}
              </span>
            </div>
          </div>

          {/* Status Stok & Pengiriman 1 Baris */}
          <div className="pt-2 border-t border-[var(--border)] flex items-center justify-between text-xs text-[var(--text-2)]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-[var(--text)]">Ready Stock (5 unit)</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <Truck className="w-3.5 h-3.5 text-[#8A6A2F] dark:text-[#D9B877]" />
              <span>Gratis Asuransi YES/Paxel</span>
            </div>
          </div>
        </div>

        {/* 4. Bagian Bawah: Accordion shadcn (Deskripsi, Sertifikat Lab, Pengiriman, Perawatan) */}
        <div className="p-3.5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-2)]">
            Informasi Mahakarya
          </h2>
          <Accordion type="single" collapsible className="w-full bg-[var(--surface)] border border-[var(--border)] rounded-2xl px-4 divide-y divide-[var(--border)] shadow-xs">
            <AccordionItem value="deskripsi" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-[var(--text)] py-3.5">
                Deskripsi Produk
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-2)] leading-relaxed space-y-2">
                <p>
                  {product.description ||
                    'Mahakarya perhiasan mutiara air laut selatan (South Sea Pearls) kualitas mirror luster alami dari perairan budidaya Sekotong & Medana, Lombok. Dirangkai dengan emas 18K solid solid.'}
                </p>
                <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] font-mono">
                  <div>Grade: <strong>{product.grade || 'AAA'}</strong></div>
                  <div>Ukuran: <strong>{selectedSize}</strong></div>
                  <div>Rangka: <strong>{selectedMetal}</strong></div>
                  <div>Origin: <strong>Lombok</strong></div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="sertifikat" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-[var(--text)] py-3.5">
                Sertifikat Gemologi Lab
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-2)] leading-relaxed space-y-2">
                <p>
                  Setiap mutiara disertai kartu sertifikasi fisik resmi dari laboratorium gemologi independen. Memuat nomor identifikasi seri, uji ketebalan nacre, bentuk bulat sempurna, dan origin perairan Lombok.
                </p>
                <div className="p-2.5 rounded-xl bg-[var(--surface-2)] flex items-center gap-2 text-[11px] font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>Garansi Keaslian 100% Uang Kembali</span>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="pengiriman" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-[var(--text)] py-3.5">
                Pengiriman &amp; Retur
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-2)] leading-relaxed space-y-1.5">
                <p>• Pengiriman gratis berasuransi penuh via JNE YES / Paxel.</p>
                <p>• Estimasi sampai 1–2 hari kerja (Jabodetabek &amp; Kota Besar).</p>
                <p>• Garansi retur 7 hari jika spesifikasi fisik tidak sesuai sertifikat.</p>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="perawatan" className="border-none">
              <AccordionTrigger className="text-xs font-semibold text-[var(--text)] py-3.5">
                Panduan Perawatan Mutiara
              </AccordionTrigger>
              <AccordionContent className="text-xs text-[var(--text-2)] leading-relaxed space-y-1.5">
                <p>• Kenakan perhiasan mutiara setelah memakai parfum dan riasan.</p>
                <p>• Bersihkan lembut dengan kain mikrofiber basah tanpa deterjen.</p>
                <p>• Simpan terpisah di kotak beludru berventilasi agar tidak tergores.</p>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {/* 5. Produk Terkait: Scroll Horizontal 4 Kartu */}
        {relatedProducts.length > 0 && (
          <div className="p-3.5 space-y-2.5">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="font-serif text-sm font-bold text-[var(--text)]">
                Koleksi Terkait
              </h3>
              <Link
                to="/katalog"
                className="text-[11px] text-[#8A6A2F] dark:text-[#D9B877] font-semibold hover:underline"
              >
                Lihat semua
              </Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto no-scrollbar snap-x snap-mandatory py-1">
              {relatedProducts.map((p) => (
                <div key={p.id} className="w-[160px] shrink-0 snap-start">
                  <ProductCard
                    id={p.id}
                    name={p.name}
                    category={p.category}
                    variety={p.variety}
                    grade={p.grade}
                    price={p.price}
                    formattedPrice={p.formattedPrice}
                    image={resolveMediaUrl(p.image)}
                    onAddToCart={() => addToCart(p as any)}
                    onSelect={() => navigate(`/produk/${p.id}`)}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. Bilah Aksi Bawah Tetap (Favorit + Keranjang + Beli Sekarang) */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] p-3 pb-safe shadow-lg">
          <div className="flex items-center gap-2 max-w-md mx-auto">
            {/* Tombol Favorit */}
            <button
              type="button"
              onClick={() => toggleWishlist(product)}
              aria-label={isFavorited ? 'Hapus dari favorit' : 'Tambah ke favorit'}
              className="min-h-[44px] min-w-[44px] rounded-full border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center text-[var(--text)] touch-feedback cursor-pointer shrink-0"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${
                  isFavorited ? 'fill-[#BA4E4E] text-[#BA4E4E]' : ''
                }`}
              />
            </button>

            {/* Tombol Keranjang (Outline) */}
            <button
              type="button"
              onClick={handleAddToCartDirect}
              className="flex-1 min-h-[44px] px-3 rounded-full border border-[#8A6A2F] dark:border-[#D9B877] bg-[var(--surface)] text-xs font-semibold text-[#8A6A2F] dark:text-[#D9B877] flex items-center justify-center gap-1.5 touch-feedback cursor-pointer shadow-2xs hover:bg-[var(--surface-2)]"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Keranjang</span>
            </button>

            {/* Tombol Beli Sekarang (Solid) */}
            <button
              type="button"
              onClick={handleBuyNow}
              className="flex-1 min-h-[44px] px-3 rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-bold flex items-center justify-center gap-1.5 touch-feedback cursor-pointer shadow-xs"
            >
              <span>Beli Sekarang</span>
            </button>
          </div>
        </div>

        {/* Sheet Pemilihan Varian (Bottom Sheet) */}
        <Sheet open={isVariantSheetOpen} onOpenChange={setIsVariantSheetOpen}>
          <SheetContent side="bottom" className="p-5 space-y-4 rounded-t-3xl max-h-[80vh] overflow-y-auto">
            <SheetHeader className="text-left pb-2 border-b border-[var(--border)]">
              <SheetTitle className="font-serif text-lg font-bold text-[var(--text)]">
                Pilih Spesifikasi Mutiara
              </SheetTitle>
            </SheetHeader>

            {/* Pilihan Ukuran */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text)] block">Ukuran Mutiara</span>
              <div className="grid grid-cols-3 gap-2">
                {['10–11 mm', '11–12 mm', '12–13 mm'].map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSelectedSize(sz)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-medium border transition-colors touch-feedback cursor-pointer ${
                      selectedSize === sz
                        ? 'border-[#8A6A2F] dark:border-[#D9B877] bg-[#8A6A2F]/10 dark:bg-[#D9B877]/15 text-[#8A6A2F] dark:text-[#D9B877] font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                    }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Warna */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text)] block">Warna Kilau</span>
              <div className="grid grid-cols-3 gap-2">
                {['Silver White', 'Champagne Gold', 'Tahitian Dark'].map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setSelectedColor(col)}
                    className={`min-h-[40px] px-2 rounded-xl text-[11px] font-medium border truncate transition-colors touch-feedback cursor-pointer ${
                      selectedColor === col
                        ? 'border-[#8A6A2F] dark:border-[#D9B877] bg-[#8A6A2F]/10 dark:bg-[#D9B877]/15 text-[#8A6A2F] dark:text-[#D9B877] font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                    }`}
                  >
                    {col}
                  </button>
                ))}
              </div>
            </div>

            {/* Pilihan Logam */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text)] block">Rangka Logam</span>
              <div className="grid grid-cols-2 gap-2">
                {['Emas Kuning 18K', 'Emas Putih 18K', 'Perak 925'].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMetal(m)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-medium border text-left truncate transition-colors touch-feedback cursor-pointer ${
                      selectedMetal === m
                        ? 'border-[#8A6A2F] dark:border-[#D9B877] bg-[#8A6A2F]/10 dark:bg-[#D9B877]/15 text-[#8A6A2F] dark:text-[#D9B877] font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Konfirmasi Tombol */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  toast.success(`✓ Spesifikasi disimpan: ${selectedSize}, ${selectedMetal}`);
                  setIsVariantSheetOpen(false);
                }}
                className="w-full min-h-[44px] rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-bold touch-feedback cursor-pointer shadow-xs"
              >
                Terapkan Spesifikasi
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ========================================================
          DESKTOP VIEW (hidden lg:block) - TERKUNCI & TETAP LENGKAP
         ======================================================== */}
      <div className="hidden lg:block w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-14 space-y-10">
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
        <div className="grid grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Photo Gallery (Left Column) */}
          <div className="col-span-7 space-y-4">
            <div className="relative aspect-4/3 w-full rounded-3xl overflow-hidden bg-[#F4F1EB] dark:bg-white/5 border border-[#E6DDD0] dark:border-white/10 shadow-lg">
              <img
                src={resolveMediaUrl(selectedImage || product.image, '/images/hero_pearl_shell.jpg')}
                alt={product.name}
                className="w-full h-full object-cover object-center transition-all duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/hero_pearl_shell.jpg';
                }}
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
                      selectedImage === img
                        ? 'border-[#8A6A2F]'
                        : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Specifications & Purchase (Right Column) */}
          <div className="col-span-5 space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#8A6A2F] dark:text-[#D9B877] mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>{typeof product.category === 'object' && product.category !== null ? (product.category as any).name : (product.category || 'Mutiara Laut Selatan')}</span>
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
                <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                  {product.grade || 'AAA'}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-[#4A5666] dark:text-[#D9B877]">Ukuran / Diameter</span>
                <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                  {product.size_mm || product.pearl_size || '11–13 mm'}
                </span>
              </div>
              <div className="flex justify-between p-3 bg-[#FBF8F3] dark:bg-white/5">
                <span className="text-[#4A5666] dark:text-[#D9B877]">Rangka Logam</span>
                <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                  {product.metal || 'Emas Kuning 18K Solid'}
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-[#4A5666] dark:text-[#D9B877]">Lokasi Budidaya</span>
                <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                  Sekotong &amp; Medana, Lombok
                </span>
              </div>
              <div className="flex justify-between p-3 bg-[#FBF8F3] dark:bg-white/5">
                <span className="text-[#4A5666] dark:text-[#D9B877]">Masa Tumbuh Tiram</span>
                <span className="font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                  24–36 Bulan Alami
                </span>
              </div>
              <div className="flex justify-between p-3">
                <span className="text-[#4A5666] dark:text-[#D9B877]">Sertifikasi</span>
                <span className="font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                  Sertifikat Gemologi Termasuk
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCartDirect}
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
    </div>
  );
};

export default ProductDetailPage;
