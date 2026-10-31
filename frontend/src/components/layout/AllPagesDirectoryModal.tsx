import React from 'react';
import {
  Home,
  Gem,
  Award,
  Sparkles,
  ShoppingBag,
  User,
  ShieldCheck,
  FileQuestion,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { Dialog } from '../ui/dialog';
import { useAuth } from '../../context/AuthContext';

interface AllPagesDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, categoryFilter?: string) => void;
  currentTab: string;
}

export const AllPagesDirectoryModal: React.FC<AllPagesDirectoryModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  currentTab,
}) => {
  const { user } = useAuth();

  const PAGES = [
    {
      id: 'home',
      name: 'Beranda & Koleksi Utama',
      subtitle: 'Etalase Utama Perhiasan Mutiara Samudera Lombok',
      category: 'Customer Storefront',
      icon: Home,
      badge: '5 Kategori',
      badgeColor: 'bg-[#BD8F4B]/15 text-[#BD8F4B]',
      description: 'Showcase Kalung, Gelang, Anting, Cincin, & Mutiara Lepas dengan filter varietas dan grade mutu.',
    },
    {
      id: 'customizer',
      name: 'Studio 3D Kustomisasi Mutiara',
      subtitle: 'Three.js WebGL Haute Joaillerie Atelier 360°',
      category: 'Interaktif 3D',
      icon: Gem,
      badge: 'OrbitControls 360°',
      badgeColor: 'bg-[#C5A880]/20 text-[#C5A880]',
      description: 'Pilih jenis mutiara air laut (Gold, White, Black Tahiti), jenis rangka emas (Kuning, Putih, Rose Gold 18K), dan custom ukuran mutiara secara real-time.',
    },
    {
      id: 'certificates',
      name: 'Verifikasi Sertifikat Gemologi',
      subtitle: 'Pencarian Nomor Registrasi & Lab Report',
      category: 'Keaslian & Transparansi',
      icon: Award,
      badge: 'Verifikasi Resmi',
      badgeColor: 'bg-emerald-100 text-emerald-800',
      description: 'Cek nomor registrasi laboratorium independen, ketebalan nacre, grade permukaan, dan asal panen Sekotong & Medana Lombok.',
    },
    {
      id: 'farm-story',
      name: 'Budidaya Sekotong & Medana',
      subtitle: 'Ekosistem Laut Alami & Konservasi Tirna Mutiara',
      category: 'Edukasi & Nilai Luhur',
      icon: Sparkles,
      badge: 'Perairan Bersih',
      badgeColor: 'bg-blue-100 text-blue-800',
      description: 'Masa tumbuh tiram 24–36 bulan di perairan bebas polusi Sekotong & Medana Lombok Barat.',
    },
    {
      id: 'cart',
      name: 'Keranjang Belanja & Konsultasi',
      subtitle: 'Rincian Pesanan & Asuransi Pengiriman',
      category: 'Transaksi',
      icon: ShoppingBag,
      badge: 'Asuransi Pengiriman',
      badgeColor: 'bg-amber-100 text-amber-800',
      description: 'Keranjang belanja belanja online dengan proteksi asuransi pengiriman perhiasan kilat.',
    },
    {
      id: 'customer',
      name: 'Portal Pelanggan Butik (/akun)',
      subtitle: 'Riwayat Pesanan, Alamat Pengiriman & Wishlist',
      category: 'Layanan Pengguna',
      icon: User,
      badge: 'Khusus Pelanggan',
      badgeColor: 'bg-indigo-100 text-indigo-800',
      description: 'Panel akun pelanggan untuk memantau status pesanan, nomor resi pengiriman, dan preferensi pribadi.',
    },
    {
      id: 'spi',
      name: 'Portal SPI (/spi)',
      subtitle: 'Satuan Pengawas Internal — Pengawasan & Otorisasi',
      category: 'Pengawasan Internal',
      icon: ShieldCheck,
      badge: 'Otorisasi & Audit',
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
      description: 'Modul resmi SPI: Ringkasan KPI, Log Aktivitas, Antrean Persetujuan, Akun & Role, serta Laporan Audit.',
    },
    {
      id: 'faq',
      name: 'Pusat Bantuan & Edukasi Mutiara',
      subtitle: 'Pertanyaan Umum Seputar Keaslian & Perawatan',
      category: 'Pusat Edukasi',
      icon: FileQuestion,
      badge: 'Panduan',
      badgeColor: 'bg-purple-100 text-purple-800',
      description: 'Jawaban resmi seputar 100% mutiara laut alami, sertifikat registrasi laboratorium, dan cara merawat perhiasan.',
    },
    {
      id: 'contact',
      name: 'Kontak & Butik Senggigi',
      subtitle: 'Galeri Fisik & Konsultasi Privat',
      category: 'Hubungi Kami',
      icon: MapPin,
      badge: 'Senggigi Boutique',
      badgeColor: 'bg-teal-100 text-teal-800',
      description: 'Alamat galeri & butik resmi di Senggigi Lombok Barat, reservasi private appointment dengan gemologist.',
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <div className="flex flex-col gap-5 sm:gap-6 text-[#12263A] max-h-[80vh] overflow-y-auto pr-1">
        {/* Header Intro */}
        <div className="border-b border-[#E6DDD0] pb-4 pr-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🧭</span>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-[#12263A]">
              Direktori Seluruh Halaman CD'E Pearls
            </h2>
          </div>
          <p className="text-xs text-[#4A5666] font-light">
            Navigasi lengkap seluruh halaman katalog, studio 3D, portal pelanggan, dan dashboard pengawasan internal SPI.
            {user && (
              <span className="ml-1 text-[#8A6A2F] font-semibold">
                (Login: {user.name} • {user.role?.toUpperCase()})
              </span>
            )}
          </p>
        </div>

        {/* Grid List of 9 Pages */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {PAGES.map((page) => {
            const isCurrent = currentTab === page.id;
            const Icon = page.icon;

            return (
              <div
                key={page.id}
                onClick={() => {
                  onNavigate(page.id);
                  onClose();
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 group hover:border-[#D9B877] hover:shadow-md ${
                  isCurrent
                    ? 'bg-[#FBF8F3] border-[#8A6A2F] shadow-sm ring-1 ring-[#8A6A2F]/30'
                    : 'bg-white border-[#E6DDD0] hover:bg-[#FBF8F3]/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                        isCurrent
                          ? 'bg-[#12263A] text-[#D9B877]'
                          : 'bg-[#F4F1EB] text-[#12263A] group-hover:bg-[#12263A] group-hover:text-white'
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-bold text-[#12263A] group-hover:text-[#8A6A2F] transition-colors">
                          {page.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            Aktif
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-medium text-[#4A5666] line-clamp-1">
                        {page.subtitle}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${page.badgeColor}`}
                  >
                    {page.badge}
                  </span>
                </div>

                <p className="text-[11px] text-[#4A5666] leading-relaxed line-clamp-2">
                  {page.description}
                </p>

                <div className="pt-2 border-t border-[#F4F1EB] flex items-center justify-between text-[11px] font-semibold text-[#8A6A2F]">
                  <span className="text-[#4A5666] text-[10px]">{page.category}</span>
                  <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Buka Halaman <ArrowRight size={12} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Dialog>
  );
};
