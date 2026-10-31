import React from 'react';
import { Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface FloatingPageNavigatorProps {
  onOpenDirectory: () => void;
  currentTab: string;
}

export const FloatingPageNavigator: React.FC<FloatingPageNavigatorProps> = ({
  onOpenDirectory,
  currentTab,
}) => {
  const { user } = useAuth();

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'home':
        return 'Beranda';
      case 'catalog':
        return 'Katalog';
      case 'customizer':
        return 'Studio 3D';
      case 'cart':
        return 'Keranjang';
      case 'customer':
        return 'Dashboard Pembeli';
      case 'admin':
        return 'SPI (Pengendali Internal)';
      case 'about':
        return 'Tentang Kami';
      case 'blog':
        return 'Edukasi';
      case 'faq':
        return 'FAQ';
      case 'contact':
        return 'Kontak';
      default:
        return 'Halaman';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <button
        onClick={onOpenDirectory}
        title="Buka Direktori Semua Halaman & Pengalih Peran"
        className="group flex items-center gap-2 sm:gap-2.5 px-3 sm:px-4 py-2 sm:py-2.5 rounded-full bg-[#161210]/95 backdrop-blur-md hover:bg-[#201814] text-white shadow-2xl border border-[#C5A880]/60 transition-all hover:scale-105 active:scale-95 cursor-pointer ring-1 ring-[#C5A880]/20"
      >
        <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-gradient-to-br from-[#C5A880] to-[#B39368] text-[#120E0C] flex items-center justify-center font-bold">
          <Compass size={15} className="group-hover:rotate-45 transition-transform" />
        </div>

        <div className="flex flex-col text-left">
          <span className="text-[9px] sm:text-[10px] font-bold text-[#C5A880] uppercase tracking-wider leading-none">
            Semua Halaman
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-white/90 leading-tight">
            {getPageTitle(currentTab)} • {user ? (user.role === 'spi' ? '🛡️ SPI' : user.role === 'admin' ? '⚙️ Admin' : '🛍️ Pembeli') : 'Tamu'}
          </span>
        </div>
      </button>
    </div>
  );
};
