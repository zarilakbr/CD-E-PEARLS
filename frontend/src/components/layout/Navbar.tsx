import React, { useState, useEffect } from 'react';
import {
  Search,
  Heart,
  ShoppingBag,
  User as UserIcon,
  Sparkles,
  Award,
  ShieldCheck,
  Boxes,
  ChevronDown,
  Menu,
  X,
  Compass,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string, categoryFilter?: string) => void;
  onSearch?: (query: string) => void;
  onOpenDirectory?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onNavigate, onSearch, onOpenDirectory }) => {
  const { totalItemsCount } = useCart();
  const { wishlistCount } = useWishlist();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchVal, setSearchVal] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);

  // Dynamic Scroll Listener for Frosted Glass Transition
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchVal(e.target.value);
    onSearch?.(e.target.value);
  };

  const getNavButtonClass = (tabName: string) => {
    const isActive = currentTab === tabName;
    return isActive
      ? 'text-amber-200 font-bold after:content-[\'\'] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-amber-300 after:rounded-full'
      : 'text-white/80 hover:text-amber-200 transition-colors';
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-300 ${
        isScrolled
          ? 'bg-[#120E0C]/90 backdrop-blur-2xl border-b border-[#2A201B] shadow-[0_10px_35px_rgba(0,0,0,0.5)] text-white'
          : 'bg-transparent border-b border-white/10 text-white shadow-none'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8 h-20 flex items-center justify-between gap-4">
        
        {/* Brand Logo (Framed Gold Badge, Exactly Matching Reference [FASET]) */}
        <div className="flex items-center gap-8 xl:gap-10">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 cursor-pointer focus:outline-none group"
          >
            <div className="px-3.5 py-1.5 rounded-lg border border-[#C5A880]/80 bg-black/40 backdrop-blur-md shadow-md flex items-center gap-2 group-hover:border-amber-300 transition-all">
              <Sparkles size={13} className="text-amber-300" />
              <span className="font-serif font-black tracking-[0.25em] text-[13px] text-amber-200 uppercase">
                CD'E PEARLS
              </span>
            </div>
          </button>

          {/* Luxury Navigation links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-[12.5px] font-semibold tracking-wide whitespace-nowrap">
            <button
              onClick={() => onNavigate('home')}
              className={`relative py-2 cursor-pointer ${getNavButtonClass('home')}`}
            >
              Beranda
            </button>

            {/* Dropdown 5 Categories */}
            <div className="relative" onMouseLeave={() => setDropdownOpen(false)}>
              <button
                onMouseEnter={() => setDropdownOpen(true)}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`flex items-center gap-1.5 py-2 cursor-pointer ${getNavButtonClass('catalog')}`}
              >
                <span>Koleksi Mutiara</span>
                <ChevronDown
                  size={13}
                  className={`transition-transform duration-200 text-amber-300 ${dropdownOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 w-60 rounded-2xl border border-[#C5A880]/30 bg-[#171210]/95 backdrop-blur-2xl p-2.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-2 duration-150 z-50 text-white">
                  <div className="px-3 py-1.5 border-b border-white/10 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                      5 Kategori Butik
                    </span>
                  </div>

                  <button
                    onClick={() => { onNavigate('catalog', 'kalung'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center">
                      <Sparkles size={13} />
                    </div>
                    <span>Kalung Mutiara</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('catalog', 'gelang'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center">
                      <Award size={13} />
                    </div>
                    <span>Gelang Mutiara</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('catalog', 'anting'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center">
                      <Sparkles size={13} />
                    </div>
                    <span>Anting Mutiara</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('catalog', 'cincin'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center">
                      <ShieldCheck size={13} />
                    </div>
                    <span>Cincin Mutiara</span>
                  </button>

                  <button
                    onClick={() => { onNavigate('catalog', 'mutiara-lepas'); setDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs font-semibold text-gray-200 hover:bg-white/10 hover:text-amber-200 transition-colors cursor-pointer"
                  >
                    <div className="w-6 h-6 rounded-lg bg-white/10 text-amber-300 flex items-center justify-center">
                      <Boxes size={13} />
                    </div>
                    <span>Mutiara Lepas (Loose Pearls)</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => onNavigate('customizer')}
              className={`relative py-2 cursor-pointer ${getNavButtonClass('customizer')}`}
            >
              Studio 3D Atelier
            </button>

            <button
              onClick={() => onNavigate('about')}
              className={`relative py-2 cursor-pointer ${getNavButtonClass('about')}`}
            >
              Tentang Kami
            </button>

            <button
              onClick={() => onNavigate('blog')}
              className={`relative py-2 cursor-pointer ${getNavButtonClass('blog')}`}
            >
              Edukasi Mutiara
            </button>

            <button
              onClick={() => onNavigate('faq')}
              className={`relative py-2 cursor-pointer ${getNavButtonClass('faq')}`}
            >
              FAQ
            </button>

            <button
              onClick={() => onNavigate('contact')}
              className={`relative py-2 cursor-pointer ${getNavButtonClass('contact')}`}
            >
              Kontak
            </button>

            {/* All Pages Directory Trigger Button */}
            <button
              onClick={onOpenDirectory}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer shadow-sm text-xs bg-white/10 hover:bg-white/20 text-amber-200 border border-white/20"
              title="Buka direktori lengkap seluruh halaman & pengalih peran"
            >
              <Compass size={13} />
              <span>Semua Halaman</span>
            </button>
          </nav>
        </div>

        {/* Right: Search Bar, Actions & Framed Outlined Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Glass Live Search Box */}
          <div className="relative hidden md:flex items-center">
            <Search size={15} className="absolute left-3.5 pointer-events-none text-amber-300" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              placeholder="Cari mutiara laut..."
              className="w-40 lg:w-48 h-9 pl-9 pr-4 rounded-full text-xs outline-none backdrop-blur-md transition-all shadow-inner bg-white/10 text-white placeholder:text-white/50 border border-white/20 focus:bg-white/20 focus:border-amber-300/60"
            />
          </div>

          {/* Wishlist Icon */}
          <button
            onClick={() => onNavigate('customer')}
            title="Koleksi Favorit"
            className="relative p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 bg-white/10 hover:bg-white/20 text-white border border-white/15"
          >
            <Heart size={18} className={wishlistCount > 0 ? 'fill-[#BA4E4E] text-[#BA4E4E]' : ''} />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#BD8F4B] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-black shadow-sm">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Cart Icon */}
          <button
            onClick={() => onNavigate('cart')}
            title="Keranjang Belanja"
            className="relative p-2.5 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95 bg-white/10 hover:bg-white/20 text-white border border-white/15"
          >
            <ShoppingBag size={18} />
            {totalItemsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#BD8F4B] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-black shadow-sm">
                {totalItemsCount}
              </span>
            )}
          </button>

          {/* User Account Button */}
          <button
            onClick={() => onNavigate('customer')}
            title={user ? `Akun: ${user.name} (${user.role})` : 'Login / Akun Pelanggan'}
            className="flex items-center gap-1.5 p-2 rounded-full backdrop-blur-md transition-all cursor-pointer shadow-sm bg-white/10 hover:bg-white/20 text-white border border-white/15"
          >
            <UserIcon size={18} />
            {user ? (
              <span className="hidden xl:inline text-xs font-bold max-w-[110px] truncate text-amber-200">
                {user.role === 'spi' ? '🛡️ SPI' : user.role === 'admin' ? '⚙️ Admin' : user.name.split(' ')[0]}
              </span>
            ) : (
              <span className="hidden xl:inline text-xs font-semibold text-white/80">Masuk</span>
            )}
          </button>

          {/* Framed Outlined Button */}
          <button
            onClick={() => onNavigate(user?.role === 'spi' ? 'spi' : user?.role === 'admin' ? 'admin' : 'customer')}
            title="Portal Manajemen & Pengawasan"
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-lg border border-[#C5A880]/80 bg-black/40 hover:bg-[#C5A880] text-amber-200 hover:text-black transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
          >
            <ShieldCheck size={13} className="shrink-0" />
            <span className="hidden sm:inline">{user?.role === 'spi' ? 'SPI' : user?.role === 'admin' ? 'Admin' : 'Portal'}</span>
            <span className="sm:hidden">{user?.role === 'spi' ? 'SPI' : 'Portal'}</span>
          </button>

          {/* Mobile Menu Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-full border transition-colors bg-white/10 text-white border-white/20"
            title="Menu"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

      </div>

      {/* Mobile Drawer Menu (Frosted Dark Glass) */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-6 py-5 bg-[#171210]/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-200 text-white">
          <div className="relative mb-2">
            <Search size={16} className="absolute left-3.5 top-2.5 text-amber-300" />
            <input
              type="text"
              value={searchVal}
              onChange={handleSearchChange}
              placeholder="Cari koleksi mutiara..."
              className="w-full h-10 pl-9 pr-4 rounded-xl bg-white/10 text-xs text-white outline-none border border-white/15"
            />
          </div>

          <button
            onClick={() => { onNavigate('home'); setMobileMenuOpen(false); }}
            className="text-left text-xs font-bold py-2 text-white hover:text-amber-200"
          >
            Beranda
          </button>

          <div className="py-2 border-y border-white/10 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Koleksi 5 Kategori:</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                onClick={() => { onNavigate('catalog', 'kalung'); setMobileMenuOpen(false); }}
                className="text-left py-1 text-gray-200 hover:text-amber-200"
              >
                • Kalung Mutiara
              </button>
              <button
                onClick={() => { onNavigate('catalog', 'gelang'); setMobileMenuOpen(false); }}
                className="text-left py-1 text-gray-200 hover:text-amber-200"
              >
                • Gelang Mutiara
              </button>
              <button
                onClick={() => { onNavigate('catalog', 'anting'); setMobileMenuOpen(false); }}
                className="text-left py-1 text-gray-200 hover:text-amber-200"
              >
                • Anting Mutiara
              </button>
              <button
                onClick={() => { onNavigate('catalog', 'cincin'); setMobileMenuOpen(false); }}
                className="text-left py-1 text-gray-200 hover:text-amber-200"
              >
                • Cincin Mutiara
              </button>
              <button
                onClick={() => { onNavigate('catalog', 'mutiara-lepas'); setMobileMenuOpen(false); }}
                className="text-left py-1 text-gray-200 hover:text-amber-200 col-span-2"
              >
                • Mutiara Lepas (Loose Pearls)
              </button>
            </div>
          </div>

          <button
            onClick={() => { onNavigate('customizer'); setMobileMenuOpen(false); }}
            className="text-left text-xs font-bold py-2 text-white hover:text-amber-200"
          >
            Studio 3D Atelier
          </button>
          <button
            onClick={() => { onNavigate('about'); setMobileMenuOpen(false); }}
            className="text-left text-xs font-bold py-2 text-white hover:text-amber-200"
          >
            Tentang Kami
          </button>
          <button
            onClick={() => { onNavigate('blog'); setMobileMenuOpen(false); }}
            className="text-left text-xs font-bold py-2 text-white hover:text-amber-200"
          >
            Edukasi Mutiara
          </button>
          <button
            onClick={() => { onNavigate('faq'); setMobileMenuOpen(false); }}
            className="text-left text-xs font-bold py-2 text-white hover:text-amber-200"
          >
            FAQ
          </button>
          <button
            onClick={() => { onNavigate('contact'); setMobileMenuOpen(false); }}
            className="text-left text-xs font-bold py-2 text-white hover:text-amber-200"
          >
            Kontak
          </button>
          <button
            onClick={() => { onOpenDirectory?.(); setMobileMenuOpen(false); }}
            className="text-left text-xs font-bold py-2 text-amber-300 flex items-center gap-1.5"
          >
            <Compass size={14} />
            <span>Semua Halaman (Direktori)</span>
          </button>
        </div>
      )}
    </header>
  );
};
