import React, { useState, useEffect, useRef } from 'react';
import {
  Menu as MenuIcon,
  X,
  Search,
  ChevronRight,
  ChevronLeft,
  Calendar,
} from 'lucide-react';
import { UserProfileDropdown } from '../components/common/UserProfileDropdown';
import { DASHBOARD_BANNERS } from '../data/dashboardBanners';
import { useTranslation } from 'react-i18next';

export interface DashboardMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
}

export interface DashboardLayoutProps {
  sidebarTitle?: string;
  menuItems: DashboardMenuItem[];
  activeMenuId: string;
  onSelectMenu: (menuId: string) => void;
  userRole?: 'user' | 'admin' | 'spi';
  userName?: string;
  userEmail?: string;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  onNavigateWebsite?: (tab: string) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
  websiteNavLinks?: { id: string; label: string }[];
  wishlistCount?: number;
  cartCount?: number;
  bannerTitle?: string;
  bannerSubtitle?: string;
  quickActions?: { label: string; onClick: () => void; icon?: React.ReactNode }[];
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  sidebarTitle = 'Menu',
  menuItems,
  activeMenuId,
  onSelectMenu,
  userRole = 'user',
  userName,
  userEmail,
  onLogout,
  onNavigateHome,
  onSearch,
  searchPlaceholder = 'Cari pesanan, produk, atau pelanggan...',
  bannerTitle,
  bannerSubtitle,
  quickActions,
  children,
}) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('cde_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const sidebarRef = useRef<HTMLElement>(null);
  const banner = DASHBOARD_BANNERS[userRole] || DASHBOARD_BANNERS.user;

  // Toggle collapse and persist in localStorage
  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('cde_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  // Time-based contextual greeting
  const [greeting, setGreeting] = useState('');
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting('Selamat Pagi');
    else if (hour >= 12 && hour < 15) setGreeting('Selamat Siang');
    else if (hour >= 15 && hour < 18) setGreeting('Selamat Sore');
    else setGreeting('Selamat Malam');

    try {
      const d = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      setFormattedDate(d);
    } catch {
      setFormattedDate('Hari Ini');
    }
  }, []);

  // Scroll listener for sticky header background
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Esc key closes mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchValue);
    }
  };

  return (
    <div className="min-h-[100dvh] flex flex-row bg-[var(--bg-dash)] text-[var(--text)] font-sans relative overflow-x-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* ========================================================
          1. SIDEBAR KIRI (Desktop: Collapsible with Tooltips)
         ======================================================== */}
      <aside
        ref={sidebarRef}
        className={`fixed lg:sticky top-0 bottom-0 z-50 lg:z-30 shrink-0 bg-gradient-to-b from-[#12263A] to-[#0D1C2B] text-white flex flex-col justify-between min-h-[100dvh] transition-all duration-300 ease-in-out border-r border-white/5 ${
          isCollapsed ? 'lg:w-[72px]' : 'lg:w-[240px]'
        } w-[240px] ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Top: Logo Resmi di Sidebar Desktop */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <div
            onClick={() => {
              if (onNavigateHome) onNavigateHome();
              setMobileMenuOpen(false);
            }}
            className="cursor-pointer group select-none py-1 overflow-hidden"
            title="Kembali ke Beranda Toko CD'E Pearls"
          >
            <div className={`p-1.5 rounded-xl bg-white/95 border border-white/20 shadow-xs inline-flex items-center justify-center transition-all ${isCollapsed ? 'p-1' : ''}`}>
              <img
                src="/images/cde_logo.png"
                alt="CD'E Pearls"
                width={120}
                height={36}
                className={`${isCollapsed ? 'h-7 w-7 object-cover' : 'h-8 sm:h-9 w-auto object-contain'} transition-transform duration-300 group-hover:scale-102`}
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
                }}
              />
            </div>
          </div>

          {/* Desktop Collapse Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-white/60 hover:text-[#D9B877] hover:bg-white/10 transition-colors cursor-pointer"
            title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Tombol Tutup Mobile Drawer */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white p-2 rounded-lg cursor-pointer"
            aria-label="Tutup menu navigasi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Middle: Menu Items */}
        <div className="p-3 flex-1 overflow-y-auto custom-scrollbar">
          {!isCollapsed && (
            <div className="px-3 py-1.5 mb-1">
              <span className="text-[11px] uppercase tracking-[0.16em] font-semibold text-[#D9B877]">
                {sidebarTitle}
              </span>
            </div>
          )}

          <nav className="flex flex-col gap-1">
            {menuItems.map((item) => {
              const isActive = activeMenuId === item.id;
              return (
                <div key={item.id} className="relative group">
                  <button
                    type="button"
                    onClick={() => {
                      onSelectMenu(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`min-h-[44px] w-full px-3 py-2.5 rounded-xl text-[14px] font-medium flex items-center transition-all cursor-pointer ${
                      isCollapsed ? 'justify-center' : 'justify-between'
                    } ${
                      isActive
                        ? 'bg-white/12 text-[#D9B877] font-semibold shadow-xs'
                        : 'text-white/80 hover:text-white hover:bg-white/6'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      {item.icon && (
                        <span className={isActive ? 'text-[#D9B877]' : 'text-white/70'}>
                          {item.icon}
                        </span>
                      )}
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && item.badge !== undefined && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#D9B877]/20 text-[#D9B877] border border-[#D9B877]/40">
                        {item.badge}
                      </span>
                    )}
                  </button>

                  {/* Tooltip when collapsed */}
                  {isCollapsed && (
                    <div className="hidden lg:group-hover:block absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 bg-[#12263A] text-white text-xs font-semibold rounded-lg shadow-xl border border-[#D9B877]/30 whitespace-nowrap pointer-events-none animate-fadeIn">
                      {item.label}
                      {item.badge !== undefined && ` (${item.badge})`}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>

        {/* Bottom: Sidebar Footer Action */}
        <div className="p-3 border-t border-white/10 flex flex-col gap-2">
          {onNavigateHome && (
            <button
              type="button"
              onClick={() => {
                onNavigateHome();
                setMobileMenuOpen(false);
              }}
              title="Lihat Website Toko"
              className={`w-full min-h-[44px] px-3 rounded-xl text-xs font-medium text-white/70 hover:text-[#D9B877] hover:bg-white/5 flex items-center transition-all cursor-pointer ${
                isCollapsed ? 'justify-center' : 'justify-between'
              }`}
            >
              {!isCollapsed && <span>{t('common.viewStore', 'Lihat Website Toko')}</span>}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </aside>

      {/* ========================================================
          2. KANAN: AREA KONTEN DENGAN TOP PHOTO BANNER & GREETING
         ======================================================== */}
      <div className="flex-1 flex flex-col min-w-0 min-h-[100dvh]">
        {/* Top Photo Banner */}
        <div className="relative w-full h-[156px] lg:h-[188px] overflow-hidden shrink-0 bg-[#12263A]">
          <picture className="absolute inset-0 w-full h-full pointer-events-none">
            <source media="(max-width: 768px)" srcSet={banner.mobileWebp} type="image/webp" />
            <source srcSet={banner.desktopWebp} type="image/webp" />
            <img
              src={banner.fallbackJpg}
              alt=""
              role="presentation"
              className="w-full h-full object-cover object-center"
            />
          </picture>

          {/* Overlay Linear Gradient Navy */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-[#12263A]/90 via-[#12263A]/75 to-[#12263A]/50 pointer-events-none"
            aria-hidden="true"
          />

          {/* Banner Text / Subtitle / Time Greeting & Quick Actions */}
          <div className="relative z-10 px-4 sm:px-6 lg:px-8 pt-16 sm:pt-14 pb-4 sm:pb-5 flex flex-col justify-end h-full text-white">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#D9B877] drop-shadow-xs">
                    {greeting}, {userName?.split(' ')[0] || (userRole === 'spi' ? 'SPI' : 'Admin')}
                  </span>
                  <div className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/10 text-white/90 border border-white/15">
                    <Calendar className="w-3 h-3 text-[#D9B877]" />
                    <span>{formattedDate}</span>
                  </div>
                </div>
                <h1 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
                  {bannerTitle || banner.defaultTitle}
                </h1>
                <p className="text-xs sm:text-sm text-white/85 drop-shadow-xs max-w-2xl line-clamp-1 sm:line-clamp-none font-light mt-0.5">
                  {bannerSubtitle || banner.defaultSubtitle}
                </p>
              </div>

              {/* Max 2 Quick Action Buttons */}
              {quickActions && quickActions.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  {quickActions.slice(0, 2).map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={action.onClick}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md ${
                        idx === 0
                          ? 'bg-[#D9B877] text-[#12263A] hover:bg-[#E5C98F]'
                          : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                      }`}
                    >
                      {action.icon}
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Header Transparan di atas banner / Sticky saat scroll */}
        <header
          className={`sticky top-0 z-20 transition-all duration-200 border-none px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3 -mt-[156px] lg:-mt-[188px] ${
            isScrolled
              ? 'bg-[var(--bg-dash)]/95 backdrop-blur-md text-[var(--text)] border-b border-[var(--border)] shadow-xs !mt-0'
              : 'bg-transparent text-white drop-shadow-xs'
          }`}
        >
          {/* Sisi Kiri: Hamburger (< lg), Logo Khusus Drawer Mobile (< lg), Search Input */}
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-inherit hover:opacity-80 transition-opacity cursor-pointer"
              aria-label="Buka menu navigasi"
            >
              <MenuIcon className="w-6 h-6" />
            </button>

            {/* Mobile Logo */}
            <div
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
              }}
              className="lg:hidden cursor-pointer flex items-center shrink-0 pr-1"
              title="CD'E Pearls"
            >
              <div className="p-1 rounded-lg bg-white/95 border border-white/20 shadow-xs inline-flex items-center justify-center">
                <img
                  src="/images/cde_logo.png"
                  alt="CD'E Pearls"
                  width={90}
                  height={26}
                  className="h-6 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
                  }}
                />
              </div>
            </div>

            {/* Unified Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md hidden sm:block">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 rounded-xl text-xs bg-white/10 hover:bg-white/15 focus:bg-white/20 text-white placeholder-white/60 border border-white/20 focus:outline-none focus:ring-1 focus:ring-[#D9B877] transition-all"
              />
            </form>
          </div>

          {/* Sisi Kanan: Single User Profile Dropdown */}
          <div className="flex items-center gap-3">
            <UserProfileDropdown
              userName={userName || 'Staf CD\'E'}
              userRole={userRole}
              userEmail={userEmail}
              onNavigateWebsite={onNavigateHome}
              onLogout={onLogout}
            />
          </div>
        </header>

        {/* ========================================================
            3. MAIN CONTENT
           ======================================================== */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
