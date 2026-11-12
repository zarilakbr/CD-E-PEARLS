import React from 'react';
import { ShieldAlert, ArrowLeft, Home, LogOut } from 'lucide-react';
import type { UserRole } from '../../context/AuthContext';
import { Seo } from '../../components/common/Seo';

interface AccessDeniedPageProps {
  currentRole: UserRole;
  attemptedPath: string;
  onNavigateHome: () => void;
  onNavigateDashboard: () => void;
  onOpenLogin?: () => void;
  onLogout?: () => void;
}

/**
 * PERHATIAN KEAMANAN SISTEM:
 * Halaman penolakan akses (Access Denied / 403) dan pengecekan rute di bawah ini HANYA bersifat SEMENTARA di front-end
 * untuk demonstrasi alur otorisasi pengguna.
 * Pada implementasi produksi, seluruh verifikasi hak akses peran (Role-Based Access Control)
 * HARUS dilakukan dan ditegakkan secara mutlak di sisi backend (API server, JWT middleware, session auth guard).
 */
export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  currentRole,
  attemptedPath,
  onNavigateHome,
  onNavigateDashboard,
  onOpenLogin,
  onLogout,
}) => {
  const roleLabels = {
    user: 'Pelanggan Butik',
    admin: 'Admin Operasional',
    spi: 'SPI (Satuan Pengawas Internal)',
  };

  const roleDashboardPaths = {
    user: '/akun (Dashboard Pelanggan)',
    admin: '/admin (Portal Admin)',
    spi: '/spi (Portal SPI)',
  };

  const requiredRole = attemptedPath.startsWith('/spi')
    ? 'SPI'
    : attemptedPath.startsWith('/admin')
    ? 'Admin'
    : attemptedPath.startsWith('/akun')
    ? 'Pelanggan'
    : 'Peran Tertentu';

  return (
    <div className="min-h-screen bg-[#FBF8F3] text-[#12263A] flex flex-col justify-between font-sans">
      <Seo
        noindex
        title="403 - Akses Ditolak | CD'E Pearls Lombok"
        description="Halaman ini memerlukan hak akses yang sesuai."
        path={attemptedPath || '/403'}
      />
      {/* Header Sederhana */}
      <header className="px-6 py-4 border-b border-[#E6DDD0] bg-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img
            src="/images/cde_logo.png"
            alt="CD'E Pearls Culture Pearls"
            className="h-10 sm:h-12 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#4A5666]">Peran Aktif:</span>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#12263A] text-[#D9B877] border border-[#D9B877]/40 uppercase">
            {currentRole}
          </span>
        </div>
      </header>

      {/* Konten 403 Forbidden */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-[#E6DDD0] rounded-3xl p-8 sm:p-10 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          {/* Ikon Perisai Peringatan */}
          <div className="w-18 h-18 mx-auto rounded-full bg-[#12263A] text-[#D9B877] border-2 border-[#D9B877] flex items-center justify-center shadow-md">
            <ShieldAlert className="w-9 h-9" />
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8A6A2F] block mb-1">
              Status 403 • Akses Terbatas
            </span>
            <h1 className="font-serif text-3xl font-semibold text-[#12263A]">
              Tidak Punya Akses
            </h1>
          </div>

          <div className="p-4 rounded-2xl bg-[#F4F1EB] border border-[#E6DDD0] text-xs text-left space-y-2">
            <div className="flex justify-between">
              <span className="text-[#4A5666]">Rute yang Dituju:</span>
              <span className="font-mono font-semibold text-[#12263A]">{attemptedPath}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#4A5666]">Peran yang Dibutuhkan:</span>
              <span className="font-semibold text-[#8A6A2F]">{requiredRole}</span>
            </div>
            <div className="flex justify-between border-t border-[#E6DDD0]/60 pt-2">
              <span className="text-[#4A5666]">Peran Akun Anda:</span>
              <span className="font-semibold text-[#12263A]">{roleLabels[currentRole]}</span>
            </div>
          </div>

          <p className="text-xs text-[#4A5666] leading-relaxed">
            Halaman ini berada di bawah perlindungan hak akses terisolasi CD'E Pearls Atelier.
            Akun Anda hanya diperbolehkan mengakses <strong>{roleDashboardPaths[currentRole]}</strong>.
          </p>

          {/* Tombol Aksi Navigasi */}
          <div className="flex flex-col gap-2.5 pt-2">
            <button
              type="button"
              onClick={onNavigateDashboard}
              className="w-full min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <ArrowLeft className="w-4 h-4 text-[#D9B877]" />
              <span>Kembali ke Dashboard Saya</span>
            </button>

            <button
              type="button"
              onClick={onNavigateHome}
              className="w-full min-h-[44px] px-6 rounded-full border border-[#12263A] text-[#12263A] hover:bg-[#F4F1EB] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#8A6A2F]" />
              <span>Ke Beranda Website</span>
            </button>

            {onOpenLogin && (
              <button
                type="button"
                onClick={onOpenLogin}
                className="text-xs text-[#8A6A2F] font-semibold hover:underline pt-1 inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Masuk dengan Akun Lain</span>
              </button>
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="text-xs text-[#4A5666] hover:text-red-600 transition-colors inline-flex items-center justify-center gap-1 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar Akun</span>
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer Hak Cipta */}
      <footer className="px-6 py-4 border-t border-[#E6DDD0] text-center text-xs text-[#4A5666]">
        © 2026 CD'E Pearls Lombok. Seluruh hak akses dan keamanan sistem terlindungi.
      </footer>
    </div>
  );
};

