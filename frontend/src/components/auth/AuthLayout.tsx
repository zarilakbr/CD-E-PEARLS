import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, ChevronLeft } from 'lucide-react';

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ title, subtitle, children }) => {
  const { t } = useTranslation();

  // Set robots noindex & title
  useEffect(() => {
    document.title = `${title} | CD'E Pearls Lombok Atelier`;
    let metaRobots = document.querySelector('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      document.head.appendChild(metaRobots);
    }
    metaRobots.setAttribute('content', 'noindex, nofollow');
  }, [title]);

  return (
    <div className="min-h-[100dvh] w-full flex flex-col lg:flex-row bg-[#FBF8F3] dark:bg-[#0D1C2B] text-[#12263A] dark:text-[#FBF8F3] font-sans transition-colors duration-200">
      {/* Kolom Kiri Desktop: Foto Mutiara Mewah CD'E Pearls */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-[#12263A] overflow-hidden flex-col justify-between p-12">
        <picture className="absolute inset-0 w-full h-full pointer-events-none">
          <source srcSet="/images/hero_pearl_shell.webp" type="image/webp" />
          <img
            src="/images/hero_pearl_shell.jpg"
            alt="CD'E Pearls South Sea Pearl Culture"
            className="w-full h-full object-cover object-center brightness-95 opacity-80"
          />
        </picture>
        {/* Luxury Linear Overlay Navy */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1C2B]/95 via-[#12263A]/70 to-[#12263A]/40 pointer-events-none" />

        {/* Brand Top */}
        <div className="relative z-10 flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <img
              src="/images/cde_logo.png"
              alt="CD'E Pearls"
              width={140}
              height={44}
              className="h-10 w-auto object-contain brightness-110 drop-shadow-md"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
              }}
            />
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-[#D9B877] hover:text-[#F3EBDD] flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{t('site.nav.home', 'Kembali ke Butik')}</span>
          </Link>
        </div>

        {/* Brand Caption Bottom */}
        <div className="relative z-10 max-w-md space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#D9B877]/30 text-[#D9B877] text-[11px] font-semibold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('common.brandTagline', 'Lombok South Sea Haute Joaillerie')}</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-white leading-tight">
            Kemurnian Kilau Mutiara Laut Selatan Lombok
          </h1>
          <p className="text-xs text-white/80 leading-relaxed font-light">
            Budidaya alami di perairan Sekotong & Medana dengan masa tumbuh 24–36 bulan. Dilengkapi sertifikat uji lab gemologi keaslian.
          </p>
        </div>
      </div>

      {/* Kolom Kanan: Kartu Form Responsif */}
      <div className="flex-1 flex flex-col justify-between p-4 sm:p-6 lg:p-12 overflow-y-auto min-h-[100dvh]">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between pb-4 border-b border-[#E6DDD0] dark:border-white/10 mb-4">
          <Link to="/">
            <img
              src="/images/cde_logo.png"
              alt="CD'E Pearls"
              width={110}
              height={32}
              className="h-7 w-auto object-contain brightness-105"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/images/cde_logo_clean.png';
              }}
            />
          </Link>
          <Link
            to="/"
            className="text-xs font-semibold text-[#8A6A2F] dark:text-[#D9B877] flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>{t('site.nav.home', 'Beranda')}</span>
          </Link>
        </div>

        {/* Centered Form Card */}
        <div className="w-full max-w-md mx-auto my-auto py-4">
          <div className="bg-white dark:bg-[#12263A] rounded-3xl p-6 sm:p-8 shadow-xl border border-[#E6DDD0] dark:border-[#8A6A2F]/30 transition-all">
            <div className="mb-6">
              <span className="block text-[11px] tracking-[0.2em] uppercase font-semibold text-[#8A6A2F] dark:text-[#D9B877]">
                CD'E Pearls Lombok
              </span>
              <h2 className="font-serif text-2xl font-bold text-[#12263A] dark:text-white mt-1">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[#4A5666] dark:text-white/70 mt-1 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {children}
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 text-center text-[11px] text-[#4A5666] dark:text-white/50">
          <p>© 2026 CD'E Pearls Lombok. Hak cipta dilindungi.</p>
        </div>
      </div>
    </div>
  );
};
