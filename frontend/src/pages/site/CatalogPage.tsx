import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Sparkles,
  SlidersHorizontal,
  Grid3X3,
  LayoutGrid,
  Check,
  RotateCcw,
  ShoppingBag,
  Home,
  RefreshCw,
  X,
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Breadcrumb } from '../../components/ui/breadcrumb';
import { BouncingDotsLoader } from '../../components/ui/loader';
import { ProductCardSkeleton } from '../../components/ui/skeleton';
import { ProductCard } from '../../components/common/ProductCard';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../components/ui/sheet';
import { Slider } from '../../components/ui/slider';
import { catalogApi } from '../../lib/api';
import { type MockProduct } from '../../data/mock';

interface CatalogPageProps {
  products?: MockProduct[];
  onAddToCart: (productName: string) => void;
  onSelectProduct: (product: MockProduct) => void;
  initialCategory?: string;
  initialSearch?: string;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  products: _propProducts,
  onAddToCart,
  onSelectProduct,
  initialCategory = 'all',
  initialSearch = '',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read initial values from URL params or props
  const paramCategory = searchParams.get('kategori') || searchParams.get('category') || initialCategory;
  const paramSort = searchParams.get('sort') || 'newest';
  const paramGrade = searchParams.get('grade') || 'all';
  const paramVariety = searchParams.get('variety') || 'all';
  const paramSearch = searchParams.get('search') || initialSearch;
  const paramMaxPrice = searchParams.get('max_price') ? Number(searchParams.get('max_price')) : 50000000;
  const paramReady = searchParams.get('ready') === 'true';

  const [searchQuery, setSearchQuery] = useState(paramSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(paramCategory);
  const [selectedVariety, setSelectedVariety] = useState<string>(paramVariety);
  const [selectedGrade, setSelectedGrade] = useState<string>(paramGrade);
  const [selectedMetal, setSelectedMetal] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>(paramSort);
  const [maxPrice, setMaxPrice] = useState<number>(paramMaxPrice);
  const [readyOnly, setReadyOnly] = useState<boolean>(paramReady);
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [gridColumns, setGridColumns] = useState<'3' | '4'>('4');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [mobileVisibleCount, setMobileVisibleCount] = useState(8);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [liveProducts, setLiveProducts] = useState<MockProduct[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  const fetchCatalog = () => {
    setIsLoading(true);
    setIsError(false);
    Promise.all([
      catalogApi.getProducts({ per_page: 100 }),
      catalogApi.getCategories().catch(() => []),
    ])
      .then(([res, catRes]) => {
        const items = res?.data || res;
        const catList = catRes?.data || catRes;
        if (Array.isArray(items)) {
          const mapped: MockProduct[] = items.map((item: any) => ({
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
            colorGroup: item.kelompok_warna || 'emas',
            colorVariant: item.varian_warna || 'Champagne',
            price: Number(item.price) || 0,
            formattedPrice: `Rp ${Number(item.price).toLocaleString('id-ID')}`,
            stock: Number(item.stock) || 0,
            status: (item.status === 'published' ? 'Aktif' : 'Nonaktif') as 'Aktif' | 'Nonaktif',
            description: item.description || '',
            image: item.image || '/images/placeholder_jewelry.svg',
            images: item.images,
          }));
          setLiveProducts(mapped);
        } else {
          setLiveProducts([]);
        }
        if (Array.isArray(catList)) {
          setCategories(catList);
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
    fetchCatalog();
  }, []);

  // Sync state if URL changes externally
  useEffect(() => {
    const cat = searchParams.get('kategori') || searchParams.get('category');
    if (cat && cat !== selectedCategory) setSelectedCategory(cat);
    const s = searchParams.get('sort');
    if (s && s !== sortBy) setSortBy(s);
    const g = searchParams.get('grade');
    if (g && g !== selectedGrade) setSelectedGrade(g);
    const v = searchParams.get('variety');
    if (v && v !== selectedVariety) setSelectedVariety(v);
    const q = searchParams.get('search');
    if (q !== null && q !== searchQuery) setSearchQuery(q);
  }, [searchParams]);

  const updateUrlParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    });
    setSearchParams(nextParams, { replace: true });
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    updateUrlParams({ kategori: cat === 'all' ? null : cat, category: null });
  };

  const handleSortSelect = (sort: string) => {
    setSortBy(sort);
    updateUrlParams({ sort: sort === 'newest' ? null : sort });
  };

  const activeFiltersCount = [
    selectedCategory !== 'all' ? 1 : 0,
    selectedGrade !== 'all' ? 1 : 0,
    selectedVariety !== 'all' ? 1 : 0,
    maxPrice < 50000000 ? 1 : 0,
    readyOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const toggleWishlist = (id: number) => {
    setWishlistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSimulateReload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 700);
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedVariety('all');
    setSelectedGrade('all');
    setSelectedMetal('all');
    setSortBy('newest');
    setMaxPrice(50000000);
    setReadyOnly(false);
    setSearchParams(new URLSearchParams(), { replace: true });
    handleSimulateReload();
  };

  // Filter products
  const rawProducts = liveProducts;
  const filteredProducts = rawProducts.filter((p) => {
    if (p.status === 'Nonaktif' || (p as any).status === 'archived' || (p as any).status === 'draft') return false;
    if (searchQuery && !p.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedCategory !== 'all' && p.categorySlug !== selectedCategory && p.category !== selectedCategory) {
      return false;
    }
    if (selectedVariety !== 'all' && p.variety !== selectedVariety) {
      return false;
    }
    if (selectedGrade !== 'all' && p.grade !== selectedGrade) {
      return false;
    }
    if (selectedMetal !== 'all' && p.metal !== selectedMetal) {
      return false;
    }
    if (p.price > maxPrice) {
      return false;
    }
    if (readyOnly && p.stock === 0) {
      return false;
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low' || sortBy === 'termurah') return a.price - b.price;
    if (sortBy === 'price-high' || sortBy === 'termahal') return b.price - a.price;
    if (sortBy === 'popular' || sortBy === 'terlaris') return ((b as any).soldCount || b.id) - ((a as any).soldCount || a.id);
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return b.id - a.id;
  });

  return (
    <div className="w-full bg-[#FBF8F3] min-h-screen">
      {/* ========================================================
          MOBILE MARKETPLACE VIEW (< lg) - TAHAP Q5
         ======================================================== */}
      <div className="lg:hidden w-full flex flex-col font-sans pb-16">
        {/* Sticky Toolbar Atas */}
        <div className="sticky top-12 z-20 bg-[var(--surface)]/95 backdrop-blur-md border-b border-[var(--border)] py-2.5 px-3 space-y-2 shadow-2xs">
          {/* 1. Chips Kategori Scroll Horizontal */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <button
              type="button"
              onClick={() => handleCategorySelect('all')}
              className={`shrink-0 min-h-[36px] px-3.5 rounded-full text-xs font-semibold transition-all touch-feedback cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] shadow-xs'
                  : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)]'
              }`}
            >
              Semua
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleCategorySelect(c.slug)}
                className={`shrink-0 min-h-[36px] px-3.5 rounded-full text-xs font-semibold transition-all touch-feedback cursor-pointer ${
                  selectedCategory === c.slug
                    ? 'bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] shadow-xs'
                    : 'bg-[var(--surface-2)] text-[var(--text-2)] hover:text-[var(--text)] border border-[var(--border)]'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* 2. Chips Urutan & Tombol Filter */}
          <div className="flex items-center justify-between gap-1.5">
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 flex-1 min-w-0">
              {[
                { id: 'newest', label: 'Terbaru' },
                { id: 'terlaris', label: 'Terlaris' },
                { id: 'termurah', label: 'Termurah' },
                { id: 'termahal', label: 'Termahal' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleSortSelect(s.id)}
                  className={`shrink-0 min-h-[32px] px-2.5 rounded-lg text-[11px] font-medium transition-colors touch-feedback cursor-pointer ${
                    sortBy === s.id
                      ? 'bg-[#8A6A2F]/15 text-[#8A6A2F] dark:bg-[#D9B877]/20 dark:text-[#D9B877] font-bold'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Tombol Filter dengan Ikon + Badge Jumlah Filter Aktif */}
            <button
              type="button"
              onClick={() => setIsFilterSheetOpen(true)}
              className="shrink-0 min-h-[36px] px-3 rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold text-[var(--text)] flex items-center gap-1.5 touch-feedback cursor-pointer shadow-2xs hover:border-[#8A6A2F]"
              aria-label="Buka filter produk"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8A6A2F] dark:text-[#D9B877]" />
              <span>Filter</span>
              {activeFiltersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#BA4E4E] text-white text-[10px] font-bold flex items-center justify-center leading-none">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Di Bawah Toolbar: Chips Filter Aktif & Jumlah Hasil */}
        <div className="px-3 pt-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {selectedCategory !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                <span>{categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Hapus filter kategori"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedGrade !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                <span>Grade {selectedGrade}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedGrade('all');
                    updateUrlParams({ grade: null });
                  }}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Hapus filter grade"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {selectedVariety !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                <span className="truncate max-w-[120px]">{selectedVariety}</span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedVariety('all');
                    updateUrlParams({ variety: null });
                  }}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Hapus filter varietas"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {readyOnly && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                <span>Ready Stock</span>
                <button
                  type="button"
                  onClick={() => {
                    setReadyOnly(false);
                    updateUrlParams({ ready: null });
                  }}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Hapus filter ready stock"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
            {maxPrice < 50000000 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-medium text-[var(--text)]">
                <span>≤ Rp {(maxPrice / 1000000).toFixed(0)} jt</span>
                <button
                  type="button"
                  onClick={() => {
                    setMaxPrice(50000000);
                    updateUrlParams({ max_price: null });
                  }}
                  className="hover:opacity-75 cursor-pointer"
                  aria-label="Hapus filter harga"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </div>

          <span className="text-[11px] font-medium text-[var(--text-2)] ml-auto">
            {sortedProducts.length} produk
          </span>
        </div>

        {/* Daftar Produk: Grid 2 Kolom (gap-2, padding-3) / Status Kosong / Galat */}
        <div className="p-3">
          {isLoading ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-8 h-8 border-2 border-[#8A6A2F] border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs text-[var(--text-2)]">Menyelaraskan koleksi mutiara...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 px-4 space-y-3">
              <p className="text-xs text-red-600 font-semibold">Gagal memuat katalog perhiasan. Periksa koneksi internet Anda.</p>
              <button
                type="button"
                onClick={fetchCatalog}
                className="min-h-[44px] px-5 rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-semibold touch-feedback cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : rawProducts.length === 0 ? (
            <div className="text-center py-14 px-4 space-y-3">
              <Sparkles className="w-8 h-8 text-[#8A6A2F] dark:text-[#D9B877] mx-auto opacity-70" />
              <h3 className="font-serif text-base font-bold text-[var(--text)]">Koleksi Segera Hadir</h3>
              <p className="text-xs text-[var(--text-2)] max-w-xs mx-auto">
                Atelier perhiasan mutiara air laut Lombok kami sedang menyiapkan koleksi istimewa untuk Anda.
              </p>
            </div>
          ) : sortedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 gap-2">
                {sortedProducts.slice(0, mobileVisibleCount).map((p) => (
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
                    isWishlisted={wishlistIds.includes(p.id)}
                    onToggleWishlist={() => toggleWishlist(p.id)}
                    onAddToCart={() => onAddToCart(p.name)}
                    onSelect={() => onSelectProduct(p)}
                  />
                ))}
              </div>

              {/* Tombol Muat Lagi */}
              {mobileVisibleCount < sortedProducts.length && (
                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setMobileVisibleCount((prev) => prev + 8)}
                    className="w-full max-w-xs min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] transition-colors touch-feedback cursor-pointer shadow-2xs"
                  >
                    Muat Lebih Banyak ({sortedProducts.length - mobileVisibleCount} tersisa)
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 px-4 space-y-3">
              <p className="text-xs text-[var(--text-2)]">Tidak ada produk yang cocok dengan filter yang dipilih.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[44px] px-5 rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-semibold touch-feedback cursor-pointer"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Sheet Filter dari Bawah (Shadcn Sheet side="bottom") */}
        <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
          <SheetContent side="bottom" className="p-5 space-y-5 rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <SheetHeader className="text-left pb-2 border-b border-[var(--border)] flex flex-row items-center justify-between">
              <SheetTitle className="font-serif text-lg font-bold text-[var(--text)]">
                Filter Perhiasan
              </SheetTitle>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-semibold text-[#8A6A2F] dark:text-[#D9B877] hover:underline cursor-pointer flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </SheetHeader>

            {/* 1. Rentang Harga (Slider) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--text)]">Rentang Harga</span>
                <span className="text-[var(--text-2)] font-mono text-[11px]">
                  s.d. Rp {maxPrice.toLocaleString('id-ID')}
                </span>
              </div>
              <Slider
                value={[maxPrice]}
                min={2000000}
                max={50000000}
                step={1000000}
                onValueChange={(val) => setMaxPrice(val[0])}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-[var(--text-2)] font-mono">
                <span>Rp 2 jt</span>
                <span>Rp 50 jt+</span>
              </div>
            </div>

            {/* 2. Grade Mutiara */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text)] block">Grade Mutiara</span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'AAA', label: 'AAA' },
                  { id: 'AA+', label: 'AA+' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrade(g.id)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-medium border transition-colors touch-feedback cursor-pointer ${
                      selectedGrade === g.id
                        ? 'border-[#8A6A2F] dark:border-[#D9B877] bg-[#8A6A2F]/10 dark:bg-[#D9B877]/15 text-[#8A6A2F] dark:text-[#D9B877] font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Jenis Mutiara (Varietas) */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text)] block">Jenis Mutiara</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'all', label: 'Semua Varietas' },
                  { id: 'South Sea Pearl', label: 'South Sea (Putih)' },
                  { id: 'Golden South Sea', label: 'Golden South Sea' },
                  { id: 'Tahitian Black Pearl', label: 'Tahitian Black' },
                ].map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedVariety(v.id)}
                    className={`min-h-[40px] px-3 rounded-xl text-xs font-medium border text-left truncate transition-colors touch-feedback cursor-pointer ${
                      selectedVariety === v.id
                        ? 'border-[#8A6A2F] dark:border-[#D9B877] bg-[#8A6A2F]/10 dark:bg-[#D9B877]/15 text-[#8A6A2F] dark:text-[#D9B877] font-bold'
                        : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Ketersediaan */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[var(--text)] block">Ketersediaan</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setReadyOnly(false)}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-medium border transition-colors touch-feedback cursor-pointer ${
                    !readyOnly
                      ? 'border-[#8A6A2F] dark:border-[#D9B877] bg-[#8A6A2F]/10 dark:bg-[#D9B877]/15 text-[#8A6A2F] dark:text-[#D9B877] font-bold'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                  }`}
                >
                  Semua Status
                </button>
                <button
                  type="button"
                  onClick={() => setReadyOnly(true)}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-medium border transition-colors touch-feedback cursor-pointer ${
                    readyOnly
                      ? 'border-[#8A6A2F] dark:border-[#D9B877] bg-[#8A6A2F]/10 dark:bg-[#D9B877]/15 text-[#8A6A2F] dark:text-[#D9B877] font-bold'
                      : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
                  }`}
                >
                  Ready Stock Saja
                </button>
              </div>
            </div>

            {/* Tombol Aksi: Reset & Terapkan */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={resetFilters}
                className="w-full min-h-[44px] rounded-full border border-[var(--border)] bg-[var(--surface)] text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] touch-feedback cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  updateUrlParams({
                    grade: selectedGrade === 'all' ? null : selectedGrade,
                    variety: selectedVariety === 'all' ? null : selectedVariety,
                    max_price: maxPrice < 50000000 ? String(maxPrice) : null,
                    ready: readyOnly ? 'true' : null,
                  });
                  setIsFilterSheetOpen(false);
                }}
                className="w-full min-h-[44px] rounded-full bg-[#12263A] text-white dark:bg-[#D9B877] dark:text-[#12263A] text-xs font-semibold touch-feedback cursor-pointer shadow-xs"
              >
                Terapkan ({sortedProducts.length})
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* ========================================================
          DESKTOP VIEW (hidden lg:block) - TERKUNCI & TIDAK BERUBAH
         ======================================================== */}
      <div className="hidden lg:block w-full py-8 md:py-14 animate-in fade-in duration-500">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* 1. BREADCRUMB WITH ICONS & BADGE */}
          <Breadcrumb
            items={[
              {
                label: 'Home',
                icon: <Home className="w-3.5 h-3.5 text-[#8A6A2F]" />,
              },
              {
                label: 'Products',
                icon: <ShoppingBag className="w-3.5 h-3.5 text-[#8A6A2F]" />,
                onClick: () => resetFilters(),
              },
              {
                label:
                  selectedCategory === 'all'
                    ? 'Katalog Mutiara'
                    : selectedCategory,
                badge: 'Grade AAA',
                isCurrent: true,
              },
            ]}
          />

          {/* Header Halaman Koleksi */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E6DDD0]">
            <div className="min-w-0 max-w-full">
              <div className="inline-flex max-w-full items-center gap-2 px-3 py-1 rounded-full bg-[#EDE6DA] border border-[#D9CFBF] mb-2 overflow-hidden">
                <Sparkles className="w-3.5 h-3.5 text-[#8A6A2F] shrink-0" />
                <span className="text-[11px] sm:text-[12px] uppercase tracking-[0.10em] sm:tracking-[0.16em] font-semibold text-[#8A6A2F] truncate">
                  Haute Joaillerie Atelier • Katalog Lengkap
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#12263A] leading-tight">
                Koleksi Perhiasan Mutiara
              </h1>
              <p className="text-[15px] text-[#4A5666] mt-2 max-w-xl">
                Eksplorasi mahakarya mutiara air laut selatan (<em>South Sea Pearls Grade AAA</em>) asli perairan Lombok dengan ikatan emas 18K solid dan perak sterling 925.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-[#4A5666] shrink-0">
              <span>Menampilkan <strong>{sortedProducts.length}</strong> perhiasan pilihan</span>
            </div>
          </div>

          {/* Toolbar Pencarian & Pengurutan */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-white border border-[#E6DDD0] p-3 sm:p-4 rounded-2xl shadow-xs">
            {/* Kolom Cari */}
            <div className="relative flex-1 max-w-md min-w-0">
              <Input
                type="text"
                placeholder="Cari nama kalung, cincin, anting..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11"
              />
              <Search className="w-4 h-4 text-[#4A5666] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Quick Category Chips */}
            <div className="hidden xl:flex items-center gap-1.5 overflow-x-auto custom-scrollbar py-1">
              <Button
                type="button"
                size="sm"
                variant={selectedCategory === 'all' ? 'default' : 'outline'}
                onClick={() => setSelectedCategory('all')}
              >
                Semua ({rawProducts.length})
              </Button>
              {categories.map((c) => (
                <Button
                  key={c.id}
                  type="button"
                  size="sm"
                  variant={selectedCategory === c.slug ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(c.slug)}
                >
                  {c.name}
                </Button>
              ))}
            </div>

            {/* Sort & Filter Controls */}
            <div className="flex flex-wrap items-center justify-between lg:justify-end gap-2 sm:gap-3 w-full lg:w-auto">
              {/* Tombol Filter Mobile */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                className="lg:hidden flex-1 sm:flex-none justify-center"
              >
                <SlidersHorizontal className="w-4 h-4 text-[#8A6A2F]" />
                <span>Filter ({[selectedCategory, selectedVariety, selectedGrade, selectedMetal].filter((x) => x !== 'all').length})</span>
              </Button>

              {/* Sort Select */}
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-1 sm:flex-none justify-end">
                <span className="text-[#4A5666] hidden md:inline">Urutkan:</span>
                <select
                  aria-label="Urutkan katalog perhiasan"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full sm:w-auto min-h-[44px] px-3 sm:px-4 rounded-full bg-[#F4F1EB] border border-[#E6DDD0] text-xs font-semibold text-[#12263A] focus:outline-none focus:border-[#12263A] cursor-pointer"
                >
                  <option value="popular">Koleksi Terpopuler</option>
                  <option value="price-low">Harga: Terendah ke Tertinggi</option>
                  <option value="price-high">Harga: Tertinggi ke Terendah</option>
                  <option value="name-asc">Nama: A - Z</option>
                </select>
              </div>

              {/* View Mode Grid 3 vs 4 & Reload */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="hidden md:flex items-center gap-1 border border-[#E6DDD0] p-1 rounded-full bg-[#F4F1EB]">
                  <button
                    type="button"
                    onClick={() => setGridColumns('3')}
                    aria-label="Grid 3 kolom"
                    className={`p-1.5 rounded-full cursor-pointer transition-all ${gridColumns === '3' ? 'bg-[#12263A] text-white' : 'text-[#4A5666] hover:text-[#12263A]'}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setGridColumns('4')}
                    aria-label="Grid 4 kolom"
                    className={`p-1.5 rounded-full cursor-pointer transition-all ${gridColumns === '4' ? 'bg-[#12263A] text-white' : 'text-[#4A5666] hover:text-[#12263A]'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleSimulateReload}
                  title="Perbarui & uji Skeleton"
                  aria-label="Perbarui data"
                  className="p-2 rounded-full border border-[#E6DDD0] bg-[#F4F1EB] text-[#4A5666] hover:text-[#12263A] hover:bg-white transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#8A6A2F]' : ''}`} />
                </button>
              </div>
            </div>
          </div>

          {/* LAYOUT UTAMA: SIDEBAR FILTER + GRID PRODUK */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* SIDEBAR FILTER */}
            <aside
              className={`lg:col-span-3 space-y-6 ${
                isMobileFilterOpen
                  ? 'fixed inset-0 z-50 bg-[#FBF8F3] p-6 overflow-y-auto block'
                  : 'hidden lg:block'
              }`}
            >
              {isMobileFilterOpen && (
                <div className="flex items-center justify-between pb-4 border-b border-[#E6DDD0] lg:hidden mb-4">
                  <h3 className="font-serif text-2xl font-semibold text-[#12263A]">Filter Koleksi</h3>
                  <Button size="sm" variant="secondary" onClick={() => setIsMobileFilterOpen(false)}>
                    Tutup ✕
                  </Button>
                </div>
              )}

              <Card className="p-6 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DDD0]">
                  <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
                    Parameter Filter
                  </span>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="text-xs font-semibold text-[#4A5666] hover:text-[#12263A] flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>

                {/* 1. Kategori */}
                <div>
                  <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-2.5">
                    Kategori Perhiasan
                  </label>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setSelectedCategory('all')}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                        selectedCategory === 'all'
                          ? 'bg-[#12263A] text-white font-semibold'
                          : 'text-[#4A5666] hover:bg-[#F4F1EB] hover:text-[#12263A]'
                      }`}
                    >
                      <span>Semua Kategori</span>
                      <span className="text-[11px] opacity-70">{rawProducts.length}</span>
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCategory(c.slug)}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                          selectedCategory === c.slug
                            ? 'bg-[#12263A] text-white font-semibold'
                            : 'text-[#4A5666] hover:bg-[#F4F1EB] hover:text-[#12263A]'
                        }`}
                      >
                        <span>{c.name}</span>
                        <span className="text-[11px] opacity-70">{c.productsCount}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Varietas Mutiara */}
                <div className="pt-4 border-t border-[#E6DDD0]">
                  <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-2.5">
                    Varietas Samudera
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'all', label: 'Semua Varietas' },
                      { id: 'South Sea Pearl', label: 'South Sea Pearl (Putih/Perak)' },
                      { id: 'Golden South Sea', label: 'Golden South Sea (Imperial)' },
                      { id: 'Tahitian Black Pearl', label: 'Tahitian Black Pearl' },
                    ].map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVariety(v.id)}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                          selectedVariety === v.id
                            ? 'bg-[#12263A] text-white font-semibold'
                            : 'text-[#4A5666] hover:bg-[#F4F1EB] hover:text-[#12263A]'
                        }`}
                      >
                        <span>{v.label}</span>
                        {selectedVariety === v.id && <Check className="w-3.5 h-3.5 text-[#D9B877]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. Grade Mutiara */}
                <div className="pt-4 border-t border-[#E6DDD0]">
                  <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-2.5">
                    Grade Gemologi
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'Semua Grade' },
                      { id: 'AAA', label: 'Grade AAA (Mirror)' },
                      { id: 'AA+', label: 'Grade AA+' },
                    ].map((g) => (
                      <Button
                        key={g.id}
                        type="button"
                        size="sm"
                        variant={selectedGrade === g.id ? 'default' : 'outline'}
                        onClick={() => setSelectedGrade(g.id)}
                        className="w-full text-center"
                      >
                        {g.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 4. Logam & Rangka */}
                <div className="pt-4 border-t border-[#E6DDD0]">
                  <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-2.5">
                    Logam Ikatan
                  </label>
                  <div className="space-y-1.5">
                    {[
                      { id: 'all', label: 'Semua Logam' },
                      { id: 'Emas 18K', label: 'Emas 18K Solid (Kuning & Putih)' },
                      { id: 'Perak 925', label: 'Perak Sterling 925' },
                    ].map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedMetal(m.id)}
                        className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${
                          selectedMetal === m.id
                            ? 'bg-[#12263A] text-white font-semibold'
                            : 'text-[#4A5666] hover:bg-[#F4F1EB] hover:text-[#12263A]'
                        }`}
                      >
                        <span>{m.label}</span>
                        {selectedMetal === m.id && <Check className="w-3.5 h-3.5 text-[#D9B877]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {isMobileFilterOpen && (
                  <Button
                    className="w-full mt-4"
                    onClick={() => setIsMobileFilterOpen(false)}
                  >
                    Terapkan Filter ({sortedProducts.length} Produk)
                  </Button>
                )}
              </Card>
            </aside>

            {/* GRID PRODUK UTAMA DENGAN SKELETON LOADER */}
            <div className="lg:col-span-9 space-y-6">
              {isLoading ? (
                <div className="space-y-6">
                  <div className="py-4 flex justify-center items-center">
                    <BouncingDotsLoader
                      size="md"
                      variant="gold"
                      label="Menyelaraskan kilau koleksi mutiara..."
                    />
                  </div>
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 ${
                      gridColumns === '3' ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                    } gap-6`}
                  >
                    {Array.from({ length: 6 }).map((_, idx) => (
                      <ProductCardSkeleton key={idx} />
                    ))}
                  </div>
                </div>
              ) : isError ? (
                <Card className="p-12 text-center max-w-md mx-auto space-y-4 border-red-200">
                  <p className="text-sm text-red-600 font-medium">
                    Gagal memuat katalog perhiasan. Periksa koneksi internet Anda.
                  </p>
                  <Button variant="default" onClick={fetchCatalog}>
                    Coba Lagi
                  </Button>
                </Card>
              ) : rawProducts.length === 0 ? (
                <Card className="p-16 text-center max-w-md mx-auto space-y-4">
                  <div className="w-20 h-20 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] mx-auto flex items-center justify-center text-[#8A6A2F]">
                    <Sparkles className="w-10 h-10 stroke-[1.5]" />
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-[#12263A]">
                    Koleksi Segera Hadir
                  </h3>
                  <p className="text-xs text-[#4A5666] leading-relaxed">
                    Atelier perhiasan mutiara air laut Lombok kami sedang menyiapkan koleksi istimewa untuk Anda.
                  </p>
                </Card>
              ) : sortedProducts.length > 0 ? (
                <div
                  className={`grid grid-cols-1 sm:grid-cols-2 ${
                    gridColumns === '3' ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
                  } gap-6`}
                >
                  {sortedProducts.map((p) => (
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
                      image={p.image}
                      isWishlisted={wishlistIds.includes(p.id)}
                      onToggleWishlist={() => toggleWishlist(p.id)}
                      onAddToCart={() => onAddToCart(p.name)}
                      onSelect={() => onSelectProduct(p)}
                    />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center max-w-md mx-auto space-y-4">
                  <div className="w-20 h-20 rounded-full bg-[#FBF8F3] border border-[#E6DDD0] mx-auto flex items-center justify-center text-[#8A6A2F]">
                    <Search className="w-8 h-8 stroke-[1.5]" />
                  </div>
                  <h3 className="font-serif text-2xl font-medium text-[#12263A]">
                    Tidak ada perhiasan yang cocok
                  </h3>
                  <p className="text-xs text-[#4A5666] leading-relaxed">
                    Coba sesuaikan kata kunci pencarian atau reset filter untuk melihat koleksi mutiara lainnya.
                  </p>
                  <Button variant="default" onClick={resetFilters}>
                    Reset Seluruh Filter
                  </Button>
                </Card>
              )}

              {/* Pagination Controls */}
              {sortedProducts.length > 0 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E6DDD0] text-xs text-[#4A5666] text-center sm:text-left">
                  <span>Menampilkan 1 - {sortedProducts.length} dari {sortedProducts.length} produk</span>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" disabled>
                      Sebelumnya
                    </Button>
                    <Button size="sm" variant="default">
                      1
                    </Button>
                    <Button size="sm" variant="outline" disabled>
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
