import React, { useState } from 'react';
import {
  MessageCircle,
  ShoppingBag,
  Check,
} from 'lucide-react';
import { ThreeCustomizer } from '../../components/atelier/ThreeCustomizer';
import { Seo } from '../../components/common/Seo';

interface Studio3DPageProps {
  onAddToCart?: (item: any) => void;
  onNavigate?: (tab: string) => void;
}

export const Studio3DPage: React.FC<Studio3DPageProps> = ({
  onAddToCart,
  onNavigate: _onNavigate,
}) => {
  const [jewelryType, setJewelryType] = useState('Kalung Mutiara');
  const [variety, setVariety] = useState('South Sea Pearl (Putih)');
  const [pearlSize, setPearlSize] = useState('11-12 mm');
  const [metal, setMetal] = useState('Emas Kuning 18K');
  const [viewMode, setViewMode] = useState<'3d' | 'placeholder'>('3d');

  // Dynamic price calculation
  const getBasePrice = () => {
    let p = 12000000;
    if (jewelryType === 'Kalung Mutiara') p = 18500000;
    if (jewelryType === 'Gelang Mutiara') p = 14200000;
    if (jewelryType === 'Cincin Solitaire') p = 12600000;
    if (jewelryType === 'Anting Stud') p = 7800000;
    if (jewelryType === 'Mutiara Lepas') p = 9500000;

    if (variety === 'Golden South Sea (Emas)') p += 2500000;
    if (variety === 'Tahitian Peacock Black') p += 1800000;

    if (pearlSize === '13-14 mm') p += 3500000;
    if (pearlSize === '15 mm (Kolektor)') p += 7000000;

    if (metal === 'Perak Sterling 925') p -= 2000000;
    return p;
  };

  const totalPrice = getBasePrice();

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <Seo
        title="Studio Kustomisasi 3D Atelier | CD'E Pearls"
        description="Rancang perhiasan mutiara laut selatan Lombok sesuai selera Anda di Studio 3D interaktif: pilih varietas mutiara, ukuran, dan ikatan emas 18K."
        path="/studio"
      />
      {/* Page Header */}
      <div className="max-w-2xl mb-10">
        <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] block mb-1">
          Haute Joaillerie Atelier
        </span>
        <h1 className="font-serif text-3xl sm:text-5xl font-medium text-[#12263A] leading-tight">
          Studio 3D Atelier CD'E Pearls
        </h1>
        <p className="text-[15px] text-[#4A5666] mt-2">
          Rancang sendiri perhiasan mutiara laut impian Anda. Pilih jenis perhiasan, warna mutiara alami Lombok, ukuran diameter, dan ikatan emas 18K.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* ========================================================
            KIRI: PRATINJAU BESAR (Kotak X / 3D Canvas)
           ======================================================== */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          <div className="relative w-full h-[400px] sm:h-[500px] rounded-2xl overflow-hidden bg-white border border-[#E6DDD0] shadow-sm flex items-center justify-center">
            {viewMode === '3d' ? (
              <div className="w-full h-full relative">
                <ThreeCustomizer />
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-white/90 border border-[#E6DDD0] text-[11px] font-semibold text-[#12263A] backdrop-blur-xs flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#8A6A2F] animate-pulse" />
                  <span>Pratinjau Interaktif 3D Canvas</span>
                </div>
              </div>
            ) : (
              <div className="w-full h-full relative overflow-hidden bg-[#12263A] group">
                <img
                  src={
                    jewelryType.includes('Cincin')
                      ? '/images/placeholder_jewelry.svg'
                      : jewelryType.includes('Gelang')
                      ? '/images/featured_pearl_dark_luxury.jpg'
                      : jewelryType.includes('Anting')
                      ? '/images/terroir_pearl_plate_left.jpg'
                      : jewelryType.includes('Lepas')
                      ? '/images/hero_pearl_dark_luxury.jpg'
                      : '/images/hero_pearl_shell.jpg'
                  }
                  alt="Pratinjau Studio Atelier Sekotong &amp; Medana"
                  width={600}
                  height={500}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-[#12263A]/85 border border-[#D9B877]/30 text-[11px] font-semibold text-[#D9B877] backdrop-blur-md">
                  Studio Atelier Still Photography
                </div>
                <div className="absolute bottom-4 left-4 z-10 text-white text-xs">
                  <p className="font-semibold text-[#D9B877]">{jewelryType} • {variety}</p>
                  <p className="text-[11px] text-white/80">Hand-finished di Atelier Sekotong &amp; Medana, Lombok</p>
                </div>
              </div>
            )}

            {/* Toggle view mode */}
            <div className="absolute bottom-4 right-4 z-10 flex gap-2">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === '3d' ? 'placeholder' : '3d')}
                className="px-3.5 py-1.5 rounded-full bg-white/95 border border-[#E6DDD0] text-xs font-semibold text-[#12263A] hover:bg-[#F4F1EB] shadow-md cursor-pointer backdrop-blur-xs transition-colors"
              >
                {viewMode === '3d' ? 'Lihat Foto Studio' : 'Buka 3D Canvas'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-white border border-[#E6DDD0] rounded-xl text-center">
              <span className="text-[11px] text-[#4A5666] uppercase block">Grade</span>
              <span className="font-semibold text-xs text-[#12263A]">AAA - Mirror Luster</span>
            </div>
            <div className="p-3 bg-white border border-[#E6DDD0] rounded-xl text-center">
              <span className="text-[11px] text-[#4A5666] uppercase block">Sertifikat</span>
              <span className="font-semibold text-xs text-[#8A6A2F]">Sertifikat lab gemologi</span>
            </div>
            <div className="p-3 bg-white border border-[#E6DDD0] rounded-xl text-center">
              <span className="text-[11px] text-[#4A5666] uppercase block">Asal Panen</span>
              <span className="font-semibold text-xs text-[#12263A]">Sekotong &amp; Medana, Lombok</span>
            </div>
          </div>
        </div>

        {/* ========================================================
            KANAN: PANEL PILIHAN KUSTOMISASI
           ======================================================== */}
        <div className="lg:col-span-5 bg-white border border-[#E6DDD0] rounded-2xl p-6 sm:p-8 space-y-6">
          <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F] block">
            Konfigurator Pesanan
          </span>

          {/* 1. Jenis Perhiasan */}
          <div>
            <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-2">
              Jenis Perhiasan
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Kalung Mutiara', 'Gelang Mutiara', 'Anting Stud', 'Cincin Solitaire', 'Mutiara Lepas'].map((jt) => (
                <button
                  key={jt}
                  type="button"
                  onClick={() => setJewelryType(jt)}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-medium text-left border transition-all cursor-pointer ${
                    jewelryType === jt
                      ? 'bg-[#12263A] text-white border-[#12263A] shadow-xs'
                      : 'bg-[#FBF8F3] text-[#4A5666] border-[#E6DDD0] hover:border-[#12263A]'
                  }`}
                >
                  {jt}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Varietas Mutiara */}
          <div>
            <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-2">
              Varietas Mutiara Samudera
            </label>
            <div className="space-y-2">
              {[
                { name: 'South Sea Pearl (Putih)', desc: 'Kilau perak sutra murni Lombok' },
                { name: 'Golden South Sea (Emas)', desc: 'Warna deep gold alami langka' },
                { name: 'Tahitian Peacock Black', desc: 'Kilau peacock hijau kehitaman eksotis' },
              ].map((v) => (
                <button
                  key={v.name}
                  type="button"
                  onClick={() => setVariety(v.name)}
                  className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                    variety === v.name
                      ? 'bg-[#12263A] text-white border-[#12263A]'
                      : 'bg-[#FBF8F3] text-[#12263A] border-[#E6DDD0] hover:border-[#12263A]'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold">{v.name}</div>
                    <div className={`text-[11px] ${variety === v.name ? 'text-white/70' : 'text-[#4A5666]'}`}>{v.desc}</div>
                  </div>
                  {variety === v.name && <Check className="w-4 h-4 text-[#D9B877]" />}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Ukuran Diameter Mutiara */}
          <div>
            <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-2">
              Ukuran Diameter (mm)
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['9-10 mm', '11-12 mm', '13-14 mm'].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setPearlSize(sz)}
                  className={`min-h-[40px] px-2 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                    pearlSize === sz
                      ? 'bg-[#12263A] text-white border-[#12263A]'
                      : 'bg-[#FBF8F3] text-[#4A5666] border-[#E6DDD0]'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Logam Dudukan */}
          <div>
            <label className="block text-xs font-semibold text-[#12263A] uppercase tracking-wider mb-2">
              Logam &amp; Rangka
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['Emas Kuning 18K', 'Emas Putih 18K', 'Perak Sterling 925'].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetal(m)}
                  className={`min-h-[40px] px-3 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                    metal === m
                      ? 'bg-[#12263A] text-white border-[#12263A]'
                      : 'bg-[#FBF8F3] text-[#4A5666] border-[#E6DDD0]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Ringkasan Harga Dinamis */}
          <div className="p-4 bg-[#FBF8F3] rounded-xl border border-[#E6DDD0] space-y-2">
            <div className="flex justify-between text-xs text-[#4A5666]">
              <span>Kategori &amp; Ukuran:</span>
              <span className="font-semibold text-[#12263A]">{jewelryType} • {pearlSize}</span>
            </div>
            <div className="flex justify-between text-xs text-[#4A5666]">
              <span>Pilihan Logam:</span>
              <span className="font-semibold text-[#12263A]">{metal}</span>
            </div>
            <div className="pt-2 border-t border-[#E6DDD0] flex justify-between items-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#12263A]">Estimasi Harga:</span>
              <span className="font-serif text-2xl font-bold text-[#12263A]">
                Rp {totalPrice.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="space-y-3 pt-2">
            <button
              type="button"
              onClick={() => {
                onAddToCart?.({
                  id: Date.now(),
                  name: `${jewelryType} Kustom (${variety})`,
                  pearlSize,
                  metal,
                  price: totalPrice,
                  formattedPrice: `Rp ${totalPrice.toLocaleString('id-ID')}`,
                  category: jewelryType,
                });
                alert(`Perhiasan kustom berhasil ditambahkan ke keranjang belanja!`);
              }}
              className="w-full min-h-[44px] rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <ShoppingBag className="w-4 h-4 text-[#D9B877]" />
              <span>Tambah Desain Ini ke Keranjang</span>
            </button>

            <a
              href={`https://wa.me/6281239001122?text=Halo%20Atelier%20CDE%20Pearls,%20saya%20tertarik%20dengan%20desain%203D%20${encodeURIComponent(jewelryType)}%20mutiara%20${encodeURIComponent(variety)}%20${encodeURIComponent(pearlSize)}%20logam%20${encodeURIComponent(metal)}%20seharga%20Rp%20${totalPrice.toLocaleString('id-ID')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full min-h-[44px] rounded-full border border-[#12263A] text-[#12263A] hover:bg-[#12263A]/5 text-xs font-semibold inline-flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-[#8A6A2F]" />
              <span>Konsultasi Desain via WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
