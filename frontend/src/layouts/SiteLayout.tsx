import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { UserProfileDropdown } from '../components/common/UserProfileDropdown';
import { SearchOverlay } from '../components/common/SearchOverlay';
import {
  Heart,
  ShoppingBag,
  X,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  Send,
  ExternalLink,
  Search,
  Sun,
  Moon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '../components/ui/accordion';

interface SiteLayoutProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  onSearch?: (query: string) => void;
  cartCount?: number;
  wishlistCount?: number;
  userRole?: 'user' | 'admin' | 'spi';
  onOpenLogin?: () => void;
  onLogout?: () => void;
  children: React.ReactNode;
}

export const SiteLayout: React.FC<SiteLayoutProps> = ({
  currentTab,
  onNavigate,
  onSearch,
  cartCount = 2,
  wishlistCount = 3,
  userRole: _userRole = 'user',
  onLogout,
  children,
}) => {
  const { t, i18n } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout: authLogout } = useAuth();

  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [headerSearch, setHeaderSearch] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOverDark, setIsOverDark] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia('(min-width: 1024px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const effectiveResolvedTheme = isMounted ? resolvedTheme : 'light';
  const effectiveWishlistCount = isMounted ? wishlistCount : 0;
  const effectiveCartCount = isMounted ? cartCount : 0;

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrolled = window.scrollY > 8;
          setIsScrolled((prev) => (prev !== scrolled ? scrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    // IntersectionObserver completely eliminates forced reflows / getBoundingClientRect in scroll
    const darkSections = document.querySelectorAll('[data-dark-section="true"]');
    let observer: IntersectionObserver | null = null;
    if (darkSections.length > 0 && typeof IntersectionObserver !== 'undefined') {
      observer = new IntersectionObserver(
        (entries) => {
          const isIntersecting = entries.some((e) => e.isIntersecting);
          setIsOverDark(isIntersecting);
        },
        { rootMargin: '-64px 0px 0px 0px' }
      );
      darkSections.forEach((el) => observer?.observe(el));
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer?.disconnect();
    };
  }, []);

  const navLinks = [
    { id: 'home', label: t('site.nav.home', 'Home') },
    { id: 'catalog', label: t('site.nav.catalog', 'Koleksi Produk') },
    { id: 'studio', label: t('site.nav.studio', 'Studio 3D Atelier') },
    { id: 'education', label: t('site.nav.education', 'Edukasi Mutiara') },
    { id: 'about', label: t('site.nav.about', 'Tentang Kami') },
  ];

  const currentLang = (i18n.language || 'id').startsWith('en') ? 'en' : 'id';
  const handleLangChange = (lang: 'id' | 'en') => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('cde_language', lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput) {
      setSubscribed(true);
      setEmailInput('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      onNavigate('catalog');
      onSearch?.(headerSearch.trim());
    }
  };

  const headerThemeClasses = isOverDark
    ? isScrolled
      ? 'bg-[#12263A]/90 backdrop-blur-md text-white border-b border-white/10'
      : 'bg-transparent text-white drop-shadow-xs'
    : isScrolled
    ? 'bg-[var(--bg)]/90 backdrop-blur-md text-[var(--text)] border-b border-[var(--border)] shadow-xs'
    : 'bg-transparent text-[var(--text)]';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg)] text-[var(--text)] font-sans">
      {/* ========================================================
          1. BAR PENGUMUMAN NAVY (Khusus Desktop >= lg, TIDAK DIRENDER di mobile < lg)
         ======================================================== */}
      {isDesktop && (
        <div
          data-slot="announcement-bar"
          className="hidden lg:block bg-[#12263A] text-[#D9B877] text-[12px] py-2 px-4 border-b border-[#D9B877]/20 select-none"
        >
          <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-6 text-center tracking-wide">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{t('site.announcement.shipping', 'Pengiriman Gratis & Berasuransi Penuh ke Seluruh Indonesia')}</span>
            </div>
            <span className="hidden sm:inline opacity-40">•</span>
            <div className="flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5" />
              <span>{t('site.announcement.consultation', 'Konsultasi Private via WhatsApp')}</span>
            </div>
            <span className="hidden sm:inline opacity-40">•</span>
            <div className="flex items-center gap-1.5">
              <span>{t('site.announcement.certificate', 'Sertifikat Gemologi Keaslian 100% Mutiara Lombok')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          2. NAVBAR (Mobile < lg: Logo + Pill Search; Desktop >= lg: Full Navbar)
         ======================================================== */}
      <header
        data-slot="mobile-header"
        className={`sticky top-0 z-30 transition-all duration-200 px-4 sm:px-6 py-2.5 sm:py-3 border-none shadow-none pt-[max(0.625rem,env(safe-area-inset-top))] ${headerThemeClasses}`}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Authentic Brand Logo CD'E Pearls */}
          <div
            onClick={() => onNavigate('home')}
            className="cursor-pointer flex items-center select-none group shrink-0 py-1"
            title="CD'E Pearls Culture Pearls Lombok"
          >
            <img
              src="/images/cde_logo.png"
              alt="CD'E Pearls Culture Pearls"
              width={120}
              height={38}
              className="h-8 sm:h-11 w-auto object-contain transition-transform duration-300 group-hover:scale-102"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
              }}
            />
          </div>

          {/* Kolom Cari Berbentuk Pil di Header Mobile (< lg) */}
          <button
            type="button"
            onClick={() => setIsSearchOverlayOpen(true)}
            data-slot="search-pill"
            className="lg:hidden flex-1 max-w-[240px] flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--surface-2)]/90 border border-[var(--border)] text-xs text-[var(--text-2)] hover:text-[var(--text)] transition-colors touch-feedback cursor-pointer shadow-2xs"
            aria-label="Buka pencarian mutiara"
          >
            <Search className="w-3.5 h-3.5 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
            <span className="truncate">{t('common.searchPublicPlaceholder', 'Cari mutiara...')}</span>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-6">
            {navLinks.map((item) => {
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  className={`text-[14px] font-medium tracking-wide transition-colors cursor-pointer relative py-1 ${
                    isActive
                      ? isOverDark && !isScrolled
                        ? 'text-white font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#D9B877]'
                        : 'text-[var(--text)] font-semibold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[2px] after:bg-[#8A6A2F] dark:after:bg-[#D9B877]'
                      : isOverDark && !isScrolled
                      ? 'text-white/80 hover:text-white'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Kolom Cari Berbentuk Pil di Header (Desktop) - min-w-0 mencegah overflow di 1024px */}
          <div className="hidden md:flex items-center flex-1 min-w-0 max-w-[150px] lg:max-w-[190px] xl:max-w-sm mx-1 sm:mx-2">
            <form onSubmit={handleHeaderSearchSubmit} className="relative w-full">
              <input
                type="text"
                placeholder={t('common.searchPublicPlaceholder', 'Cari perhiasan, mutiara, grade AAA...')}
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className={`w-full min-h-[40px] pl-10 pr-8 rounded-full text-xs transition-all shadow-2xs focus:outline-none ${
                  isOverDark && !isScrolled
                    ? 'bg-black/25 border border-white/30 text-white placeholder-white/60 focus:border-white focus:bg-black/40'
                    : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text)] placeholder-[var(--text-2)]/60 focus:border-[#8A6A2F]'
                }`}
              />
              <Search
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                  isOverDark && !isScrolled ? 'text-[#D9B877]' : 'text-[#8A6A2F] dark:text-[#D9B877]'
                }`}
              />
              {headerSearch && (
                <button
                  type="button"
                  onClick={() => setHeaderSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-inherit hover:opacity-100 opacity-60"
                  aria-label="Bersihkan pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>
          </div>

          {/* Controls: Bahasa (ID|EN), Tema (Pill Switch), Wishlist, Cart, User Profile */}
          <div className="hidden lg:flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Language Segmented Control ID | EN (TAHAP D) - hidden on mobile <sm, available in mobile drawer */}
            <div
              role="group"
              aria-label={t('common.switchLang', 'Pilih Bahasa')}
              className={`hidden sm:inline-flex items-center p-0.5 rounded-lg border text-[11px] font-semibold transition-colors ${
                isOverDark && !isScrolled
                  ? 'border-white/20 bg-black/25 text-white'
                  : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)]'
              }`}
            >
              <button
                type="button"
                aria-pressed={currentLang === 'id'}
                onClick={() => handleLangChange('id')}
                className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  currentLang === 'id'
                    ? isOverDark && !isScrolled
                      ? 'bg-white text-[#12263A] font-bold shadow-2xs'
                      : 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] font-bold shadow-2xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                aria-pressed={currentLang === 'en'}
                onClick={() => handleLangChange('en')}
                className={`px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                  currentLang === 'en'
                    ? isOverDark && !isScrolled
                      ? 'bg-white text-[#12263A] font-bold shadow-2xs'
                      : 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] font-bold shadow-2xs'
                    : 'opacity-70 hover:opacity-100'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme Switch Pill 56x28px dengan ikon Sun & Moon (TAHAP C) - hidden on mobile <sm, available in mobile drawer */}
            <button
              type="button"
              role="switch"
              aria-checked={effectiveResolvedTheme === 'dark'}
              aria-label={t('common.switchTheme', 'Ganti tema tampilan')}
              onClick={toggleTheme}
              className={`hidden sm:flex relative w-[56px] h-[28px] rounded-full p-1 transition-colors cursor-pointer items-center justify-between border shrink-0 ${
                effectiveResolvedTheme === 'dark'
                  ? 'bg-[#1D354E] border-[#D9B877]/50 text-[#D9B877]'
                  : isOverDark && !isScrolled
                  ? 'bg-black/30 border-white/30 text-white'
                  : 'bg-[#EDE6DA] border-[#D9B877]/40 text-[#8A6A2F]'
              }`}
            >
              <Sun className="w-3.5 h-3.5 ml-0.5 z-10 pointer-events-none" />
              <Moon className="w-3.5 h-3.5 mr-0.5 z-10 pointer-events-none" />
              <span
                className={`absolute top-[2px] bottom-[2px] w-[22px] rounded-full shadow-sm transition-transform duration-200 ease-out ${
                  effectiveResolvedTheme === 'dark'
                    ? 'translate-x-[28px] bg-[#D9B877]'
                    : 'translate-x-0 bg-white'
                }`}
              />
            </button>

            {/* Wishlist */}
            <button
              type="button"
              onClick={() => onNavigate('favorit')}
              aria-label="Koleksi Favorit"
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center text-inherit hover:opacity-80 transition-opacity cursor-pointer"
            >
              <Heart className="w-5 h-5" />
              {effectiveWishlistCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#8A6A2F] text-white text-[10px] font-bold flex items-center justify-center">
                  {effectiveWishlistCount}
                </span>
              )}
            </button>

            {/* Cart */}
            <button
              type="button"
              onClick={() => onNavigate('keranjang')}
              aria-label="Keranjang Belanja"
              className="relative min-h-[44px] min-w-[44px] flex items-center justify-center text-inherit hover:opacity-80 transition-opacity cursor-pointer"
            >
              <ShoppingBag className="w-5 h-5" />
              {effectiveCartCount > 0 && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-[#12263A] text-[#D9B877] text-[10px] font-bold flex items-center justify-center">
                  {effectiveCartCount}
                </span>
              )}
            </button>

            {/* Authenticated: Real User Profile Dropdown | Unauthenticated: Masuk & Daftar */}
            {isAuthenticated && user ? (
              <UserProfileDropdown
                userName={user.name}
                userEmail={user.email}
                userRole={user.role}
                userPlan={
                  user.role === 'spi'
                    ? 'SPI'
                    : user.role === 'admin'
                    ? 'Admin Operasional'
                    : 'Pelanggan Butik'
                }
                avatarUrl={user.avatar_url || undefined}
                showNameInTrigger={false}
                onViewProfile={() => {
                  if (user.role === 'spi') onNavigate('spi');
                  else if (user.role === 'admin') onNavigate('admin');
                  else onNavigate('akun');
                }}
                onSettings={() => {
                  if (user.role === 'spi') onNavigate('spi');
                  else if (user.role === 'admin') onNavigate('admin');
                  else onNavigate('akun');
                }}
                onHelpCenter={() => onNavigate('about')}
                onLogout={onLogout || authLogout}
                align="right"
              />
            ) : (
              <div className="flex items-center gap-1 sm:gap-2">
                <Link
                  to="/masuk"
                  className="min-h-[36px] sm:min-h-[38px] px-2.5 sm:px-3.5 rounded-full text-xs font-semibold text-inherit hover:opacity-85 transition-opacity cursor-pointer border border-current/25 inline-flex items-center justify-center"
                >
                  {t('auth.login', 'Masuk')}
                </Link>
                <Link
                  to="/daftar"
                  className={`hidden sm:inline-flex min-h-[38px] px-3.5 sm:px-4 rounded-full text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-xs items-center justify-center ${
                    isOverDark && !isScrolled
                      ? 'bg-[#D9B877] text-[#12263A] hover:bg-[#E5C98F]'
                      : 'bg-[#12263A] text-white hover:bg-[#1A3652] dark:bg-[#D9B877] dark:text-[#12263A]'
                  }`}
                >
                  {t('auth.register', 'Daftar')}
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Overlay (Command Palette) */}
      <SearchOverlay open={isSearchOverlayOpen} onOpenChange={setIsSearchOverlayOpen} />

      {/* ========================================================
          3. KONTEN HALAMAN WEBSITE (dengan padding bawah untuk tab bar)
         ======================================================== */}
      <main className="flex-1 w-full pb-16 lg:pb-0">{children}</main>

      {/* ========================================================
          4. FOOTER WEBSITE (Midnight #0D1C2B)
         ======================================================== */}
      <footer className="bg-[#0D1C2B] text-white pt-8 sm:pt-16 pb-12 border-t border-white/10">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Mobile Footer Accordion (< lg) - Q3.7 */}
          <div className="lg:hidden pb-6 space-y-5">
            <div className="flex flex-col items-center text-center gap-2">
              <img
                src="/images/cde_logo.png"
                alt="CD'E Pearls Culture Pearls"
                width={120}
                height={40}
                className="h-10 w-auto object-contain brightness-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
                }}
              />
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#D9B877]">
                {t('common.brandTagline', 'Lombok South Sea Haute Joaillerie')}
              </span>
            </div>

            <Accordion type="single" collapsible className="w-full border-t border-b border-white/10 divide-y divide-white/10">
              <AccordionItem value="tentang" className="border-none">
                <AccordionTrigger className="text-white hover:text-[#D9B877] py-3 text-xs tracking-wide">
                  Tentang Atelier
                </AccordionTrigger>
                <AccordionContent className="text-white/70 space-y-2 pt-1 pb-3 text-xs">
                  <p><button type="button" onClick={() => onNavigate('about')} className="hover:text-white transition-colors cursor-pointer">Tentang CD'E Pearls</button></p>
                  <p><button type="button" onClick={() => onNavigate('studio')} className="hover:text-white transition-colors cursor-pointer">Studio 3D Atelier</button></p>
                  <p><button type="button" onClick={() => onNavigate('education')} className="hover:text-white transition-colors cursor-pointer">Edukasi &amp; Gradasi Mutiara</button></p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bantuan" className="border-none">
                <AccordionTrigger className="text-white hover:text-[#D9B877] py-3 text-xs tracking-wide">
                  Layanan &amp; Bantuan
                </AccordionTrigger>
                <AccordionContent className="text-white/70 space-y-2 pt-1 pb-3 text-xs">
                  <p><button type="button" onClick={() => onNavigate('faq')} className="hover:text-white transition-colors cursor-pointer">Pusat Bantuan</button></p>
                  <p><button type="button" onClick={() => onNavigate('lacak-pesanan')} className="hover:text-white transition-colors cursor-pointer">Lacak Status Pesanan</button></p>
                  <p><button type="button" onClick={() => onNavigate('cek-sertifikat')} className="hover:text-white transition-colors cursor-pointer">Cek Sertifikat Gemologi</button></p>
                  <p><button type="button" onClick={() => onNavigate('contact')} className="hover:text-white transition-colors cursor-pointer">Kontak Concierge</button></p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="legal" className="border-none">
                <AccordionTrigger className="text-white hover:text-[#D9B877] py-3 text-xs tracking-wide">
                  Informasi Legal
                </AccordionTrigger>
                <AccordionContent className="text-white/70 space-y-2 pt-1 pb-3 text-xs">
                  <p><button type="button" onClick={() => onNavigate('syarat-ketentuan')} className="hover:text-white transition-colors cursor-pointer">Syarat &amp; Ketentuan</button></p>
                  <p><button type="button" onClick={() => onNavigate('kebijakan-privasi')} className="hover:text-white transition-colors cursor-pointer">Kebijakan Privasi</button></p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Social Icons 36px Round Buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#D9B877] hover:text-[#12263A] transition-colors flex items-center justify-center text-white text-xs"
                aria-label="Instagram CD'E Pearls"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <a
                href="mailto:concierge@cdepearls.com"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#D9B877] hover:text-[#12263A] transition-colors flex items-center justify-center text-white"
                aria-label="Email Concierge"
              >
                <Mail className="w-4 h-4" />
              </a>
              <a
                href="tel:+6281239001122"
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-[#D9B877] hover:text-[#12263A] transition-colors flex items-center justify-center text-white"
                aria-label="Telepon Butik"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>

            <p className="text-center text-[11px] text-white/50 pt-2 border-t border-white/10">
              &copy; 2026 CD'E Pearls Lombok. Hak Cipta Dilindungi.
            </p>
          </div>

          {/* Desktop Footer (hidden lg:block) */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-white/10">
              {/* Col 1 & 2: Brand & Newsletter */}
              <div className="lg:col-span-2 flex flex-col items-start gap-4">
                <div className="flex flex-col items-start gap-2">
                  <img
                    src="/images/cde_logo.png"
                    alt="CD'E Pearls Culture Pearls"
                    width={160}
                    height={56}
                    className="h-14 sm:h-16 w-auto object-contain brightness-110 drop-shadow-md"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
                    }}
                  />
                  <span className="text-[10px] uppercase tracking-[0.26em] font-semibold text-[#D9B877] pl-1">
                    {t('common.brandTagline', 'Lombok South Sea Haute Joaillerie')}
                  </span>
                </div>

                <p className="text-[14px] text-white/70 max-w-sm leading-relaxed">
                  {t('site.footer.description', 'Atelier perhiasan mutiara air laut selatan (South Sea Pearls) asli dari perairan budidaya Sekotong & Medana, Lombok. Dirangkai tangan dengan emas 18K solid dan sertifikat lab gemologi independen.')}
                </p>

                {/* Newsletter subscription form */}
                <div className="w-full max-w-md mt-2">
                  <span className="text-[12px] uppercase tracking-[0.16em] text-[#D9B877] font-semibold block mb-2">
                    {t('site.footer.newsletterTitle', 'Dapatkan Buletin Koleksi Khusus')}
                  </span>
                  <form onSubmit={handleSubscribe} className="flex items-center gap-2">
                    <input
                      type="email"
                      required
                      placeholder={t('site.footer.newsletterPlaceholder', 'Masukkan alamat email Anda')}
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="flex-1 min-h-[44px] px-4 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 text-[14px] focus:outline-none focus:border-[#D9B877]"
                    />
                    <button
                      type="submit"
                      className="min-h-[44px] px-5 rounded-full bg-[#D9B877] text-[#12263A] font-semibold text-xs hover:bg-[#e4ca93] transition-colors inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                    >
                      <span>{t('site.footer.subscribe', 'Daftar')}</span>
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                  {subscribed && (
                    <span className="text-xs text-[#E2F1E0] mt-2 block">
                      {t('site.footer.subscribed', '✓ Terima kasih! Anda telah terdaftar dalam buletin eksklusif kami.')}
                    </span>
                  )}
                </div>
              </div>

              {/* Col 3: Our Products */}
              <div>
                <h4 className="text-[12px] uppercase tracking-[0.16em] text-[#D9B877] font-semibold mb-4">
                  {t('site.footer.ourProducts', 'Koleksi Perhiasan')}
                </h4>
                <ul className="flex flex-col gap-2.5 text-[14px] text-white/70">
                  <li><button type="button" onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors cursor-pointer">Kalung Mutiara</button></li>
                  <li><button type="button" onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors cursor-pointer">Gelang Emas 18K</button></li>
                  <li><button type="button" onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors cursor-pointer">Anting Stud &amp; Drop</button></li>
                  <li><button type="button" onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors cursor-pointer">Cincin Solitaire</button></li>
                  <li><button type="button" onClick={() => onNavigate('catalog')} className="hover:text-white transition-colors cursor-pointer">Mutiara Lepas Grade AAA</button></li>
                </ul>
              </div>

              {/* Col 4: Layanan & Order */}
              <div>
                <h4 className="text-[12px] uppercase tracking-[0.16em] text-[#D9B877] font-semibold mb-4">
                  {t('site.footer.services', 'Layanan Butik')}
                </h4>
                <ul className="flex flex-col gap-2.5 text-[14px] text-white/70">
                  <li><button type="button" onClick={() => onNavigate('studio')} className="hover:text-white transition-colors cursor-pointer">Studio 3D Atelier</button></li>
                  <li><button type="button" onClick={() => onNavigate('education')} className="hover:text-white transition-colors cursor-pointer">Edukasi &amp; Gradasi Mutiara</button></li>
                  <li><button type="button" onClick={() => onNavigate('keranjang')} className="hover:text-white transition-colors cursor-pointer">Status Pesanan &amp; Resi</button></li>
                  <li><button type="button" onClick={() => onNavigate('akun')} className="hover:text-white transition-colors cursor-pointer">Portal Pelanggan</button></li>
                  <li><button type="button" onClick={() => onNavigate('admin')} className="hover:text-white transition-colors cursor-pointer">Portal Admin Toko</button></li>
                </ul>
              </div>

              {/* Col 5: Contact & Concierge */}
              <div>
                <h4 className="text-[12px] uppercase tracking-[0.16em] text-[#D9B877] font-semibold mb-4">
                  Concierge Atelier
                </h4>
                <ul className="flex flex-col gap-3 text-[14px] text-white/70">
                  <li className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#D9B877]" />
                    <span>+62 812-3900-1122</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D9B877]" />
                    <span>concierge@cdepearls.com</span>
                  </li>
                  <li className="pt-2">
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-[#D9B877] hover:underline"
                    >
                      <span>Instagram: @cdepearlslombok</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                </ul>
              </div>
            </div>

            {/* Copyright bar */}
            <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-white/60">
              <div>
                &copy; 2026 CD'E Pearls Lombok. {t('common.allRightsReserved', 'Hak Cipta Dilindungi Undang-Undang.')}
              </div>
              <div className="flex items-center gap-6">
                <span onClick={() => onNavigate('about')} className="hover:text-white cursor-pointer">{t('site.nav.about', 'Tentang Kami')}</span>
                <span className="hover:text-white cursor-pointer">{t('common.privacyPolicy', 'Kebijakan Privasi')}</span>
                <span className="hover:text-white cursor-pointer">{t('common.terms', 'Syarat & Ketentuan')}</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
