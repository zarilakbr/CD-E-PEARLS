import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, User, Settings, HelpCircle, LogOut, Sun, Moon, Laptop } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export interface UserProfileDropdownProps {
  userName?: string;
  userEmail?: string;
  userPlan?: string;
  userRole?: 'user' | 'admin' | 'spi';
  roleBadge?: React.ReactNode;
  avatarUrl?: string;
  align?: 'left' | 'right';
  showNameInTrigger?: boolean;
  defaultOpen?: boolean;
  onViewProfile?: () => void;
  onSettings?: () => void;
  onHelpCenter?: () => void;
  onLogout?: () => void;
  onSelectMenu?: (menuId: string) => void;
  onNavigateWebsite?: (tab: string) => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({
  userName,
  userEmail,
  userPlan,
  userRole = 'user',
  roleBadge,
  avatarUrl,
  align = 'right',
  showNameInTrigger = false,
  defaultOpen = false,
  onViewProfile,
  onSettings,
  onHelpCenter,
  onLogout,
  onSelectMenu,
  onNavigateWebsite,
}) => {
  const menuId = useId();
  const { t, i18n } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { logout: authLogout } = useAuth();

  const [isOpen, setIsOpen] = useState<boolean>(() => {
    if (defaultOpen) return true;
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('openProfile') === 'true';
    }
    return false;
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerButtonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Default identitas per peran
  let defaultName = 'Siti Rahmawati';
  let defaultRoleTitle = t('customer.profile.title', 'Pelanggan Butik');
  let defaultMail = 'siti.rahma@gmail.com';

  if (userRole === 'admin') {
    defaultName = 'Budi Santoso';
    defaultRoleTitle = 'Admin Operasional';
    defaultMail = 'admin@cdepearls.com';
  } else if (userRole === 'spi') {
    defaultName = 'Hj. Baiq Ratna Sari';
    defaultRoleTitle = 'SPI';
    defaultMail = 'owner.spi@cdepearls.com';
  }

  const displayName =
    userName && !userName.toLowerCase().includes('alex')
      ? userName
      : defaultName;

  const displayPlan =
    userPlan && !userPlan.toLowerCase().includes('pro plan')
      ? userPlan
      : defaultRoleTitle;

  const displayEmail =
    userEmail && !userEmail.toLowerCase().includes('alex')
      ? userEmail
      : defaultMail;

  const getInitials = (nameStr: string) => {
    const parts = nameStr.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return (nameStr.slice(0, 2) || 'CD').toUpperCase();
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      itemRefs.current[0]?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsOpen(false);
        triggerButtonRef.current?.focus();
        return;
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const validItems = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
        if (validItems.length === 0) return;

        const currentIndex = validItems.indexOf(document.activeElement as HTMLButtonElement);
        let nextIndex = 0;

        if (e.key === 'ArrowDown') {
          nextIndex = currentIndex >= validItems.length - 1 ? 0 : currentIndex + 1;
        } else {
          nextIndex = currentIndex <= 0 ? validItems.length - 1 : currentIndex - 1;
        }

        validItems[nextIndex]?.focus();
      }

      if (e.key === 'Home') {
        e.preventDefault();
        itemRefs.current[0]?.focus();
      }

      if (e.key === 'End') {
        e.preventDefault();
        const validItems = itemRefs.current.filter(Boolean) as HTMLButtonElement[];
        validItems[validItems.length - 1]?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleAction = (callback?: () => void) => {
    setIsOpen(false);
    triggerButtonRef.current?.focus();
    if (callback) {
      callback();
    }
  };

  const handleLogout = () => {
    setIsOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      authLogout();
    }
  };

  const handleViewProfile = () => {
    handleAction(() => {
      if (onViewProfile) {
        onViewProfile();
      } else if (userRole === 'user') {
        if (onSelectMenu) onSelectMenu('profile');
        else if (onNavigateWebsite) onNavigateWebsite('akun');
        else window.location.href = '/akun';
      } else if (userRole === 'admin') {
        if (onSelectMenu) onSelectMenu('settings');
        else window.location.href = '/admin?menu=settings';
      } else if (userRole === 'spi') {
        if (onSelectMenu) onSelectMenu('ringkasan');
        else window.location.href = '/spi';
      }
    });
  };

  const handleSettings = () => {
    handleAction(() => {
      if (onSettings) {
        onSettings();
      } else if (userRole === 'admin') {
        if (onSelectMenu) onSelectMenu('settings');
        else window.location.href = '/admin?menu=settings';
      } else if (userRole === 'user') {
        if (onSelectMenu) onSelectMenu('profile');
        else window.location.href = '/akun';
      }
    });
  };

  const handleHelpCenter = () => {
    handleAction(() => {
      if (onHelpCenter) {
        onHelpCenter();
      } else if (onNavigateWebsite) {
        onNavigateWebsite('about');
      } else {
        window.open('https://wa.me/6281239001122?text=Halo%20Atelier%20CDE%20Pearls,%20saya%20butuh%20bantuan', '_blank');
      }
    });
  };

  const currentLang = (i18n.language || 'id').startsWith('en') ? 'en' : 'id';
  const handleLangChange = (lang: 'id' | 'en') => {
    i18n.changeLanguage(lang);
    try {
      localStorage.setItem('cde_language', lang);
      document.documentElement.lang = lang;
    } catch {}
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        ref={triggerButtonRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-label={t('common.profile', 'Menu Profil Pengguna')}
        className="min-h-[44px] min-w-[44px] p-1 flex items-center gap-1.5 rounded-full text-inherit hover:opacity-90 transition-opacity cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8A6A2F]"
      >
        {avatarUrl && avatarUrl.startsWith('/images/') ? (
          <img
            src={avatarUrl}
            alt={displayName}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-white/30"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-[#12263A] text-[#D9B877] font-serif font-semibold text-xs flex items-center justify-center shrink-0 border border-[#D9B877]/40 shadow-xs">
            {getInitials(displayName)}
          </div>
        )}

        {showNameInTrigger && (
          <div className="hidden sm:flex flex-col text-left pl-1 pr-1">
            <span className="text-[13px] font-semibold leading-tight truncate max-w-[120px]">
              {displayName}
            </span>
            <span className="text-[10px] opacity-75 tracking-wider uppercase truncate">
              {displayPlan}
            </span>
          </div>
        )}

        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 shrink-0 opacity-80 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="menu"
          aria-orientation="vertical"
          aria-label="Menu akun pengguna"
          className={`absolute ${
            align === 'left' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
          } z-50 mt-2 w-[min(19rem,calc(100vw-2rem))] rounded-2xl bg-[var(--surface)] text-[var(--text)] shadow-xl border border-[var(--border)] overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
        >
          {/* Header Info Pengguna */}
          <div className="p-4 bg-[var(--bg-alt)] border-b border-[var(--border)] flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#12263A] text-[#D9B877] font-serif font-semibold text-sm flex items-center justify-center shrink-0 border border-[#8A6A2F]/40 shadow-xs">
              {getInitials(displayName)}
            </div>
            <div className="overflow-hidden text-left flex-1 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="text-sm font-semibold truncate font-serif text-[var(--text)]">
                  {displayName}
                </p>
                {roleBadge ? (
                  roleBadge
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#12263A] text-[#D9B877] border border-[#8A6A2F]/30">
                    {userRole === 'spi' ? 'SPI' : userRole === 'admin' ? 'Admin' : 'Pelanggan'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#8A6A2F] dark:text-[#D9B877] font-medium truncate mt-0.5">
                {displayPlan}
              </p>
              <p className="text-[11px] text-[var(--text-2)] truncate mt-0.5">
                {displayEmail}
              </p>
            </div>
          </div>

          {/* Daftar Navigasi Menu */}
          <div className="p-2 space-y-0.5">
            {/* 1. Lihat Profil */}
            <button
              ref={(el) => { itemRefs.current[0] = el; }}
              type="button"
              role="menuitem"
              onClick={handleViewProfile}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[#8A6A2F] dark:hover:text-[#D9B877] transition-colors cursor-pointer focus:bg-[var(--surface-2)] focus:outline-none"
            >
              <User className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
              <span>{t('customer.menu.profile', 'Lihat Profil')}</span>
            </button>

            {/* 2. Pengaturan (Disembunyikan jika SPI) */}
            {userRole !== 'spi' && (
              <button
                ref={(el) => { itemRefs.current[1] = el; }}
                type="button"
                role="menuitem"
                onClick={handleSettings}
                className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[#8A6A2F] dark:hover:text-[#D9B877] transition-colors cursor-pointer focus:bg-[var(--surface-2)] focus:outline-none"
              >
                <Settings className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
                <span>{t('admin.menu.settings', 'Pengaturan')}</span>
              </button>
            )}

            {/* 3. Pusat Bantuan */}
            <button
              ref={(el) => { itemRefs.current[2] = el; }}
              type="button"
              role="menuitem"
              onClick={handleHelpCenter}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text)] hover:bg-[var(--surface-2)] hover:text-[#8A6A2F] dark:hover:text-[#D9B877] transition-colors cursor-pointer focus:bg-[var(--surface-2)] focus:outline-none"
            >
              <HelpCircle className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
              <span>{t('customer.menu.support', 'Pusat Bantuan')}</span>
            </button>

            {/* Pemisah Preferensi */}
            <div className="h-px my-1.5 bg-[var(--border)]" />

            {/* Kontrol Tema di Dropdown (TAHAP C) */}
            <div className="px-3 py-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[var(--text-2)]">
                {t('common.theme', 'Tema')}
              </span>
              <div
                role="radiogroup"
                aria-label="Pilih Tema"
                className="inline-flex items-center p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]"
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={theme === 'light'}
                  title="Terang"
                  onClick={() => setTheme('light')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    theme === 'light'
                      ? 'bg-[var(--surface)] text-[#8A6A2F] shadow-2xs font-semibold'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span className="sr-only">Terang</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={theme === 'dark'}
                  title="Gelap"
                  onClick={() => setTheme('dark')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-[var(--surface)] text-[#D9B877] shadow-2xs font-semibold'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span className="sr-only">Gelap</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={theme === 'system'}
                  title="Sistem"
                  onClick={() => setTheme('system')}
                  className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                    theme === 'system'
                      ? 'bg-[var(--surface)] text-[var(--text)] shadow-2xs font-semibold'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  }`}
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span className="sr-only">Sistem</span>
                </button>
              </div>
            </div>

            {/* Kontrol Bahasa di Dropdown (TAHAP D) */}
            <div className="px-3 py-1.5 flex items-center justify-between gap-2">
              <span className="text-[11px] font-medium text-[var(--text-2)]">
                {t('common.language', 'Bahasa')}
              </span>
              <div
                role="group"
                aria-label="Pilih Bahasa"
                className="inline-flex items-center p-0.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] text-[11px] font-semibold"
              >
                <button
                  type="button"
                  aria-pressed={currentLang === 'id'}
                  onClick={() => handleLangChange('id')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    currentLang === 'id'
                      ? 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] shadow-2xs font-bold'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  }`}
                >
                  ID
                </button>
                <button
                  type="button"
                  aria-pressed={currentLang === 'en'}
                  onClick={() => handleLangChange('en')}
                  className={`px-2 py-0.5 rounded-md transition-colors cursor-pointer ${
                    currentLang === 'en'
                      ? 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] shadow-2xs font-bold'
                      : 'text-[var(--text-2)] hover:text-[var(--text)]'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* Pemisah Keluar */}
            <div className="h-px my-1.5 bg-[var(--border)]" />

            {/* 4. Keluar */}
            <button
              ref={(el) => { itemRefs.current[3] = el; }}
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer focus:bg-rose-50 focus:outline-none"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>{t('auth.logout', 'Keluar Akun')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
