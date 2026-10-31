import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Sparkles, Heart, ShoppingBag, User } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useWishlist } from '../../context/WishlistContext';
import { cn } from '../../lib/utils';

export const BottomTabBar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalItemsCount } = useCart();
  const { wishlist } = useWishlist();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Deteksi keyboard terbuka di perangkat mobile untuk menyembunyikan tab bar
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleResize = () => {
      if (window.visualViewport) {
        const heightDiff = window.innerHeight - window.visualViewport.height;
        setIsKeyboardOpen(heightDiff > 160);
      }
    };

    window.visualViewport.addEventListener('resize', handleResize);
    return () => window.visualViewport?.removeEventListener('resize', handleResize);
  }, []);

  const p = location.pathname;

  // Sembunyikan tab bar di halaman detail produk, checkout, admin, spi, dan seluruh auth
  const isHidden =
    isKeyboardOpen ||
    p.startsWith('/produk/') ||
    p.startsWith('/checkout') ||
    p.startsWith('/admin') ||
    p.startsWith('/spi') ||
    p === '/masuk' ||
    p === '/daftar' ||
    p === '/lupa-kata-sandi' ||
    p === '/atur-ulang-kata-sandi' ||
    p === '/verifikasi-email' ||
    p.startsWith('/auth/');

  if (isHidden) return null;

  const tabs = [
    { id: 'home', label: 'Beranda', icon: Home, path: '/' },
    { id: 'catalog', label: 'Katalog', icon: Sparkles, path: '/katalog' },
    {
      id: 'wishlist',
      label: 'Favorit',
      icon: Heart,
      path: '/favorit',
      badge: wishlist.length > 0 ? wishlist.length : undefined,
    },
    {
      id: 'cart',
      label: 'Keranjang',
      icon: ShoppingBag,
      path: '/keranjang',
      badge: totalItemsCount > 0 ? totalItemsCount : undefined,
    },
    { id: 'account', label: 'Akun', icon: User, path: '/akun' },
  ];

  const getActiveTab = () => {
    if (p === '/') return 'home';
    if (p.startsWith('/katalog')) return 'catalog';
    if (p.startsWith('/favorit')) return 'wishlist';
    if (p.startsWith('/keranjang')) return 'cart';
    if (p.startsWith('/akun') || p.startsWith('/admin') || p.startsWith('/spi')) return 'account';
    return '';
  };

  const activeTab = getActiveTab();

  return (
    <nav
      aria-label="Navigasi Utama Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] shadow-lg transition-transform duration-250 pb-safe"
    >
      <div className="grid grid-cols-5 h-14 max-w-md mx-auto items-center relative">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => navigate(tab.path)}
              className={cn(
                'relative flex flex-col items-center justify-center h-full touch-feedback transition-colors select-none py-1',
                isActive
                  ? 'text-[#8A6A2F] dark:text-[#D9B877] font-semibold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              )}
            >
              {/* Active Tab Top Indicator Bar */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2.5px] rounded-full bg-[#8A6A2F] dark:bg-[#D9B877] animate-in fade-in duration-200" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative">
                <Icon
                  className={cn(
                    'w-5 h-5 transition-transform duration-150',
                    isActive && 'scale-110'
                  )}
                  strokeWidth={isActive ? 2.4 : 1.8}
                />
                {typeof tab.badge === 'number' && (
                  <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#BA4E4E] text-white text-[10px] font-bold flex items-center justify-center leading-none animate-badge-pulse shadow-xs">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </div>

              {/* Single Word Label 11px */}
              <span className="text-[11px] leading-tight mt-1 tracking-tight">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
