import React from 'react';
import { LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeVariant?: 'default' | 'gold' | 'warning' | 'neutral';
  onClick?: () => void;
}

export interface SidebarProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onSelect'> {
  brandTitle?: string;
  brandSubtitle?: string;
  brandLogo?: React.ReactNode;
  items: SidebarItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  onLogout?: () => void;
  logoutLabel?: string;
  theme?: 'navy' | 'light';
}

export const PearlSidebar: React.FC<SidebarProps> = ({
  brandTitle = "CD'E Pearls",
  brandSubtitle = 'Lombok Atelier',
  brandLogo,
  items,
  activeId,
  onSelect,
  onLogout,
  logoutLabel = 'Keluar',
  theme = 'navy',
  className,
  ...props
}) => {
  const isNavy = theme === 'navy';

  const containerClasses = isNavy
    ? 'bg-[#12263A] text-white border-r border-[#12263A]/80'
    : 'bg-white text-[#12263A] border-r border-[#E6DDD0]';

  return (
    <div
      className={cn(
        'flex h-full w-64 flex-col justify-between transition-all duration-300 font-sans',
        containerClasses,
        className
      )}
      {...props}
    >
      {/* Bagian Atas: Brand & Menu Navigasi */}
      <div className="px-4 py-5 flex-1 overflow-y-auto custom-scrollbar">
        {/* Brand Header: Logo Only yang sudah ada tulisan CD'E Pearls */}
        <div className="px-2 mb-6 select-none">
          {brandLogo ? (
            brandLogo
          ) : (
            <div className="flex items-center">
              <img
                src="/images/cde_logo.png"
                alt="CD'E Pearls Culture Pearls"
                className="h-10 sm:h-11 w-auto object-contain brightness-110"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
                }}
              />
            </div>
          )}
        </div>

        {/* Menu Navigasi */}
        <ul className="space-y-1.5">
          {items.map((item) => {
            const isActive = activeId === item.id;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => {
                    item.onClick?.();
                    onSelect?.(item.id);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs sm:text-[13px] font-medium transition-all duration-200 cursor-pointer min-h-[44px]',
                    isNavy
                      ? isActive
                        ? 'bg-white/12 text-[#D9B877] font-semibold shadow-xs'
                        : 'text-white/75 hover:bg-white/6 hover:text-white'
                      : isActive
                      ? 'bg-[#F4F1EB] text-[#12263A] font-semibold border border-[#E6DDD0] shadow-2xs'
                      : 'text-[#4A5666] hover:bg-[#F4F1EB] hover:text-[#12263A]'
                  )}
                >
                  <div className="flex items-center gap-3 truncate">
                    {item.icon && (
                      <span
                        className={cn(
                          'size-4.5 shrink-0',
                          isActive
                            ? isNavy
                              ? 'text-[#D9B877]'
                              : 'text-[#8A6A2F]'
                            : isNavy
                            ? 'text-white/60'
                            : 'text-[#4A5666]'
                        )}
                      >
                        {item.icon}
                      </span>
                    )}
                    <span className="truncate">{item.label}</span>
                  </div>

                  {item.badge !== undefined && (
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide border',
                        isNavy
                          ? 'bg-[#D9B877]/20 text-[#D9B877] border-[#D9B877]/30'
                          : 'bg-[#EDE6DA] text-[#8A6A2F] border-[#D9CFBF]'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Bagian Bawah: Sticky Logout */}
      {onLogout && (
        <div
          className={cn(
            'sticky inset-x-0 bottom-0 p-3 border-t',
            isNavy ? 'border-white/10 bg-[#0E1E2E]/80 backdrop-blur-xs' : 'border-[#E6DDD0] bg-[#FBF8F3]/90 backdrop-blur-xs'
          )}
        >
          <button
            type="button"
            onClick={onLogout}
            className={cn(
              'group relative flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-3 text-xs font-semibold transition-all duration-200 cursor-pointer min-h-[42px]',
              isNavy
                ? 'text-red-300 hover:bg-red-950/40 hover:text-red-200 border border-red-500/20'
                : 'text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-200'
            )}
          >
            <LogOut className="size-4 shrink-0" />
            <span>{logoutLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
};

