import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, ShoppingBag, ArrowLeft } from 'lucide-react';

export const NotFoundPage: React.FC = () => {

  useEffect(() => {
    document.title = "404 - Halaman Tidak Ditemukan | CD'E Pearls Lombok";
  }, []);

  return (
    <div className="min-h-screen bg-[#FBF8F3] dark:bg-[#0D1C2B] text-[#12263A] dark:text-[#FBF8F3] flex flex-col justify-between font-sans transition-colors duration-200">
      {/* Top Header */}
      <header className="px-6 py-4 border-b border-[#E6DDD0] dark:border-white/10 bg-white/80 dark:bg-[#12263A]/80 backdrop-blur-md flex items-center justify-between">
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
        <Link
          to="/"
          className="text-xs font-semibold text-[#8A6A2F] dark:text-[#D9B877] flex items-center gap-1.5 hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-xl space-y-6">
          <div className="w-20 h-20 mx-auto rounded-full bg-[#12263A] dark:bg-white/10 text-[#D9B877] border-2 border-[#D9B877] flex items-center justify-center shadow-md">
            <Compass className="w-10 h-10 animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#8A6A2F] dark:text-[#D9B877] block">
              Status 404 • Halaman Tidak Ditemukan
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] leading-relaxed font-light pt-1">
              Halaman atau tautan koleksi yang Anda tuju mungkin telah dipindahkan, berganti nama, atau belum terdaftar di katalog kami.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              to="/"
              className="flex-1 min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Home className="w-4 h-4 text-[#D9B877]" />
              <span>Kembali ke Beranda</span>
            </Link>
            <Link
              to="/katalog"
              className="flex-1 min-h-[44px] px-6 rounded-full border border-[#12263A] dark:border-white/20 text-[#12263A] dark:text-[#FBF8F3] hover:bg-[#F4F1EB] dark:hover:bg-white/5 active:scale-95 transition-all text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877]" />
              <span>Jelajahi Koleksi</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-[#E6DDD0] dark:border-white/10 text-center text-xs text-[#4A5666] dark:text-[#D9B877]">
        © 2026 CD'E Pearls Lombok. Butik Resmi Perhiasan Mutiara Laut Selatan.
      </footer>
    </div>
  );
};

export default NotFoundPage;
