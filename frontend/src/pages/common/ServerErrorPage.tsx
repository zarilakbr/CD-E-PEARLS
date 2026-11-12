import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Home, RefreshCw } from 'lucide-react';
import { Seo } from '../../components/common/Seo';

export const ServerErrorPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#FBF8F3] dark:bg-[#0D1C2B] text-[#12263A] dark:text-[#FBF8F3] flex flex-col justify-between font-sans transition-colors duration-200">
      <Seo
        noindex
        title="500 - Kendala Server | CD'E Pearls Lombok"
        description="Terjadi kendala sementara pada sistem CD'E Pearls Lombok."
        path="/500"
      />
      <header className="px-6 py-4 border-b border-[#E6DDD0] dark:border-white/10 bg-white/80 dark:bg-[#12263A]/80 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center">
          <img
            src="/images/cde_logo.png"
            alt="CD'E Pearls"
            width={120}
            height={38}
            className="h-9 w-auto object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
            }}
          />
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-800 flex items-center justify-center shadow-md">
            <AlertTriangle className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8A6A2F] dark:text-[#D9B877] block">
              Status 500 • Kendala Sistem
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Terjadi Kendala Sistem
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] leading-relaxed font-light pt-1">
              Sistem atelier butik kami sedang memulihkan koneksi data. Mohon muat ulang halaman ini atau kembali ke beranda.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex-1 min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <RefreshCw className="w-4 h-4 text-[#D9B877]" />
              <span>Muat Ulang Halaman</span>
            </button>
            <Link
              to="/"
              className="flex-1 min-h-[44px] px-6 rounded-full border border-[#12263A] dark:border-white/20 text-[#12263A] dark:text-[#FBF8F3] hover:bg-[#F4F1EB] dark:hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <Home className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877]" />
              <span>Ke Beranda</span>
            </Link>
          </div>
        </div>
      </main>

      <footer className="px-6 py-4 border-t border-[#E6DDD0] dark:border-white/10 text-center text-xs text-[#4A5666] dark:text-[#D9B877]">
        © 2026 CD'E Pearls Lombok. Seluruh hak cipta dilindungi undang-undang.
      </footer>
    </div>
  );
};

export default ServerErrorPage;
