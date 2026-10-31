import React, { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card } from '../../components/ui/card';
import { Breadcrumb } from '../../components/ui/breadcrumb';
import { BouncingDotsLoader } from '../../components/ui/loader';
import { ProductCardSkeleton } from '../../components/ui/skeleton';
import { ProductCard } from '../../components/common/ProductCard';
import { mockCategories, mockProducts, type MockProduct } from '../../data/mock';

interface CatalogPageProps {
  onAddToCart: (productName: string) => void;
  onSelectProduct: (product: MockProduct) => void;
  initialCategory?: string;
  initialSearch?: string;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({
  onAddToCart,
  onSelectProduct,
  initialCategory = 'all',
  initialSearch = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedMetal, setSelectedMetal] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('popular');
  const [wishlistIds, setWishlistIds] = useState<number[]>([1, 3]);
  const [gridColumns, setGridColumns] = useState<'3' | '4'>('4');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
    setSortBy('popular');
    handleSimulateReload();
  };

  // Filter products
  const filteredProducts = mockProducts.filter((p) => {
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
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'price-low') return a.price - b.price;
    if (sortBy === 'price-high') return b.price - a.price;
    if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
    return b.id - a.id;
  });

  return (
    <div className="w-full bg-[#FBF8F3] min-h-screen py-8 md:py-14 animate-in fade-in duration-500">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* ========================================================
            1. BREADCRUMB WITH ICONS & BADGE
           ======================================================== */}
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
              Semua ({mockProducts.length})
            </Button>
            {mockCategories.map((c) => (
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
              <span>Filter ({[selectedCategory, selectedVariety, selectedGrade, selectedMetal].filter(x => x !== 'all').length})</span>
            </Button>

            {/* Sort Select */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-xs flex-1 sm:flex-none justify-end">
              <span className="text-[#4A5666] hidden md:inline">Urutkan:</span>
              <select
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

        {/* ========================================================
            LAYOUT UTAMA: SIDEBAR FILTER + GRID PRODUK
           ======================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* SIDEBAR FILTER (Desktop & Mobile Drawer) */}
          <aside
            className={`lg:col-span-3 space-y-6 ${isMobileFilterOpen
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
                    className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${selectedCategory === 'all'
                      ? 'bg-[#12263A] text-white font-semibold'
                      : 'text-[#4A5666] hover:bg-[#F4F1EB] hover:text-[#12263A]'
                      }`}
                  >
                    <span>Semua Kategori</span>
                    <span className="text-[11px] opacity-70">{mockProducts.length}</span>
                  </button>
                  {mockCategories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCategory(c.slug)}
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${selectedCategory === c.slug
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
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${selectedVariety === v.id
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
                      className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-all cursor-pointer ${selectedMetal === m.id
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
              /* Keadaan Kosong (Empty State) */
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
  );
};

