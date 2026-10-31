import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  ShieldCheck,
  Truck,
  BookOpen,
  Info,
  PhoneCall,
  HelpCircle,
  FileText,
  Lock,
  ChevronRight,
  Sun,
  Moon,
  Laptop,
  Globe,
  LogIn,
  UserPlus,
} from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from 'react-i18next';

export const GuestAccountHub: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { i18n } = useTranslation();

  const currentLang = i18n.language.startsWith('en') ? 'en' : 'id';

  const menuRows = [
    { label: 'Studio 3D', icon: Sparkles, path: '/studio' },
    { label: 'Cek Sertifikat', icon: ShieldCheck, path: '/cek-sertifikat' },
    { label: 'Lacak Pesanan', icon: Truck, path: '/lacak-pesanan' },
    { label: 'Edukasi Mutiara', icon: BookOpen, path: '/edukasi' },
    { label: 'Tentang Atelier', icon: Info, path: '/tentang' },
    { label: 'Kontak Butik', icon: PhoneCall, path: '/kontak' },
    { label: 'Pusat Bantuan', icon: HelpCircle, path: '/bantuan' },
    { label: 'Syarat & Ketentuan', icon: FileText, path: '/syarat-ketentuan' },
    { label: 'Kebijakan Privasi', icon: Lock, path: '/kebijakan-privasi' },
  ];

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[var(--bg)] py-6 px-3.5 sm:px-6 max-w-lg mx-auto space-y-4 font-sans animate-in fade-in duration-250 pb-20">
      {/* 1. Kartu Kecil Masuk dan Daftar */}
      <Card className="p-4 sm:p-5 bg-[var(--surface)] border-[var(--border)] shadow-xs rounded-2xl">
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-full bg-[#12263A] text-[#D9B877] flex items-center justify-center shrink-0 border border-[#D9B877]/30 shadow-xs">
            <span className="font-serif text-lg font-bold">CD</span>
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-lg font-semibold text-[var(--text)] truncate">
              Akun Koleksi Tamu
            </h1>
            <p className="text-[12px] text-[var(--text-2)] truncate">
              Masuk untuk kelola pesanan & sertifikat
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <Button
            type="button"
            variant="default"
            onClick={() => navigate('/masuk?next=/akun')}
            className="w-full min-h-[44px] text-xs font-semibold gap-1.5 touch-feedback"
          >
            <LogIn className="w-4 h-4" />
            <span>Masuk</span>
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/daftar?next=/akun')}
            className="w-full min-h-[44px] text-xs font-semibold gap-1.5 touch-feedback"
          >
            <UserPlus className="w-4 h-4" />
            <span>Daftar</span>
          </Button>
        </div>
      </Card>

      {/* 2. Daftar Baris Menu Navigasi dengan Chevron */}
      <Card className="bg-[var(--surface)] border-[var(--border)] shadow-xs rounded-2xl overflow-hidden divide-y divide-[var(--border)]">
        {menuRows.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className="w-full min-h-[48px] px-4 py-3 flex items-center justify-between text-left hover:bg-[var(--surface-2)] transition-colors touch-feedback group"
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877] shrink-0" />
                <span className="text-xs font-medium text-[var(--text)] group-hover:text-[#8A6A2F] dark:group-hover:text-[#D9B877] transition-colors">
                  {item.label}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 text-[var(--text-2)] opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </Card>

      {/* 3. Pengaturan Bahasa & Tema (Satu Pemilih Masing-Masing) */}
      <Card className="p-4 bg-[var(--surface)] border-[var(--border)] shadow-xs rounded-2xl space-y-3.5">
        {/* Pemilih Bahasa */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877]" />
            <span className="text-xs font-medium text-[var(--text)]">Bahasa</span>
          </div>
          <div
            role="group"
            aria-label="Pilih Bahasa"
            className="inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-xs font-semibold"
          >
            <button
              type="button"
              aria-pressed={currentLang === 'id'}
              onClick={() => i18n.changeLanguage('id')}
              className={`min-h-[32px] px-3 rounded-md transition-colors ${
                currentLang === 'id'
                  ? 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] shadow-xs font-bold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              ID
            </button>
            <button
              type="button"
              aria-pressed={currentLang === 'en'}
              onClick={() => i18n.changeLanguage('en')}
              className={`min-h-[32px] px-3 rounded-md transition-colors ${
                currentLang === 'en'
                  ? 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] shadow-xs font-bold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* Pemilih Tema */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#8A6A2F] dark:text-[#D9B877]" />
            <span className="text-xs font-medium text-[var(--text)]">Tema Tampilan</span>
          </div>
          <div
            role="group"
            aria-label="Pilih Tema"
            className="inline-flex items-center p-0.5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] text-xs"
          >
            <button
              type="button"
              onClick={() => setTheme('light')}
              aria-label="Mode Terang"
              className={`min-h-[32px] px-2.5 rounded-md transition-colors ${
                theme === 'light'
                  ? 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] shadow-xs font-semibold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('dark')}
              aria-label="Mode Gelap"
              className={`min-h-[32px] px-2.5 rounded-md transition-colors ${
                theme === 'dark'
                  ? 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] shadow-xs font-semibold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setTheme('system')}
              aria-label="Mode Sistem"
              className={`min-h-[32px] px-2.5 rounded-md transition-colors ${
                theme === 'system'
                  ? 'bg-[var(--surface)] text-[#8A6A2F] dark:text-[#D9B877] shadow-xs font-semibold'
                  : 'text-[var(--text-2)] hover:text-[var(--text)]'
              }`}
            >
              <Laptop className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
};
