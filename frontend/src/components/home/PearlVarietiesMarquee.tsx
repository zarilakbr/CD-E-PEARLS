import React, { useState } from 'react';
import { Sparkles, ArrowRight, Layers, SlidersHorizontal } from 'lucide-react';
import { resolveMediaUrl } from '../../lib/media';

export interface PearlVariety {
  id: string;
  name: string;
  scientificName: string;
  origin: string;
  tone: string;
  luster: string;
  grade: string;
  sizeRange: string;
  description: string;
  image?: string;
}

export const pearlVarietiesData: PearlVariety[] = [
  {
    id: 'white-south-sea',
    name: 'White South Sea',
    scientificName: 'Pinctada Maxima (Silver-lipped)',
    origin: 'Sekotong & Medana, Lombok',
    tone: 'Silvery White & Soft Rose',
    luster: 'Mirror Luster',
    grade: 'Grade AAA',
    sizeRange: '10–16 mm',
    description: 'Ratu mutiara laut selatan dengan lapisan nacre paling tebal dan pantulan cahaya cermin sempurna.',
    image: '/images/hero_pearl_shell.jpg',
  },
  {
    id: 'golden-south-sea',
    name: 'Golden South Sea',
    scientificName: 'Pinctada Maxima (Gold-lipped)',
    origin: 'Lombok Barat & Sumbawa',
    tone: '24K Royal Gold & Deep Champagne',
    luster: 'Warm Golden Glow',
    grade: 'Grade AAA',
    sizeRange: '11–15 mm',
    description: 'Warna emas murni alami tanpa pewarna sintetis, langka dan dipanen dari perairan laut dalam.',
    image: '/images/hero_pearl_dark_luxury.jpg',
  },
  {
    id: 'tahitian-black',
    name: 'Tahitian Black Pearl',
    scientificName: 'Pinctada Margaritifera',
    origin: 'Samudera Pasifik Tropis',
    tone: 'Peacock Green, Aubergine & Charcoal',
    luster: 'Iridescent Metallic',
    grade: 'Grade AAA',
    sizeRange: '9–14 mm',
    description: 'Mutiara hitam eksotis dengan kilauan warna-warni merak yang memikat dan dramatis.',
    image: '/images/terroir_pearl_plate_left.jpg',
  },
  {
    id: 'silver-champagne',
    name: 'Silver Champagne',
    scientificName: 'Pinctada Maxima',
    origin: 'Perairan Lombok Utara',
    tone: 'Soft Sunlight & Champagne Bronze',
    luster: 'Deep Velvety Luster',
    grade: 'Grade AA+',
    sizeRange: '10–14 mm',
    description: 'Perpaduan gradasi perak lembut dan kehangatan madu samudera dengan aura anggun.',
    image: '/images/featured_pearl_dark_luxury.jpg',
  },
  {
    id: 'baroque-south-sea',
    name: 'Baroque South Sea',
    scientificName: 'Pinctada Maxima Natural Freeform',
    origin: 'Nusa Tenggara Barat',
    tone: 'Multi-hue Organic Iridescence',
    luster: 'High Spectral Reflection',
    grade: 'Atelier Selection',
    sizeRange: '12–18 mm',
    description: 'Karya seni alam tanpa bentuk bulat simetris; setiap butir memiliki lekuk organik yang tiada duanya.',
    image: '/images/hero_pearl_bg.jpg',
  },
  {
    id: 'keshi-pure-nacre',
    name: 'Keshi Pure Nacre',
    scientificName: 'Non-nucleated Natural Pearl',
    origin: 'Teluk Pemenang, Lombok',
    tone: 'Luminous Silver & Ivory',
    luster: 'Intense Organic Flash',
    grade: '100% Nacre Murni',
    sizeRange: '6–10 mm',
    description: 'Terbentuk tanpa inti buatan (full nacre) menghasilkan pantulan cahaya kristalin alami yang sangat kuat.',
    image: '/images/hero_pearl_shell.jpg',
  },
  {
    id: 'mabe-blister',
    name: 'Mabe Blister Pearl',
    scientificName: 'Pinctada Maxima Hemispherical',
    origin: 'Pesisir Terumbu Karang Lombok',
    tone: 'Pearly White & Rainbow Rim',
    luster: 'Smooth High Sheen',
    grade: 'Grade AAA',
    sizeRange: '13–17 mm',
    description: 'Mutiara kubah setengah bulat yang ideal untuk mahakarya cincin megah dan anting bertahtakan emas.',
    image: '/images/hero_pearl_shell.jpg',
  },
  {
    id: 'akoya-luster',
    name: 'Akoya Luster Pearl',
    scientificName: 'Pinctada Fucata Martensii',
    origin: 'Samudera Pesisir Tenang',
    tone: 'Porcelain White & Pale Rose',
    luster: 'Extreme Ball-Mirror',
    grade: 'Grade AAA',
    sizeRange: '7–9 mm',
    description: 'Mutiara klasik dengan kebulatan sempurna dan kejernihan pantulan bayangan paling tajam.',
    image: '/images/featured_pearl_dark_luxury.jpg',
  },
];

interface PearlVarietiesMarqueeProps {
  onSelectVariety?: (varietyId: string) => void;
  className?: string;
}

export const PearlVarietiesMarquee: React.FC<PearlVarietiesMarqueeProps> = ({
  onSelectVariety,
  className = '',
}) => {
  const [viewMode, setViewMode] = useState<'marquee' | 'grid'>('marquee');

  // Double array for seamless infinite marquee loop
  const marqueeItems = [...pearlVarietiesData, ...pearlVarietiesData];

  return (
    <section className={`bg-white py-16 sm:py-20 border-y border-[#E6DDD0] relative overflow-hidden ${className}`}>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Bagian */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EDE6DA] border border-[#D9CFBF] mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#8A6A2F]" />
              <span className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#8A6A2F]">
                Varietas Mutiara Samudera • Species &amp; Harvests
              </span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-[42px] font-medium text-[#12263A] leading-tight">
              Kilau Alami Berbagai Varietas Samudera
            </h2>
            <p className="mt-2 text-[15px] text-[#4A5666] max-w-2xl leading-relaxed">
              CD'E Pearls mengkurasi butir mutiara air laut terbaik langsung dari pembudidayaan perairan dalam Sekotong &amp; Medana, Lombok dan samudera tropis, dengan ketebalan nacre murni dan grade gemologi tertinggi.
            </p>
          </div>

          {/* Toggle Mode: Marquee Dinamis / Grid Kartu */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('marquee')}
              className={`min-h-[40px] px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'marquee'
                  ? 'bg-[#12263A] text-[#D9B877] shadow-xs'
                  : 'bg-[#F4F1EB] text-[#4A5666] hover:text-[#12263A] border border-[#E6DDD0]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Marquee Mengalir</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`min-h-[40px] px-4 rounded-full text-xs font-semibold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#12263A] text-[#D9B877] shadow-xs'
                  : 'bg-[#F4F1EB] text-[#4A5666] hover:text-[#12263A] border border-[#E6DDD0]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tampilan Grid</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODE 1: MARQUEE DENGAN GRADIENT FADE DI KIRI & KANAN
         ======================================================== */}
      {viewMode === 'marquee' ? (
        <div className="relative w-full overflow-hidden py-4 group">
          {/* Efek Fade Halus di Kiri & Kanan */}
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-white via-white/80 to-transparent z-10" />

          {/* Jalur Marquee 1 (Kiri ke Kanan / Berjalan Halus) */}
          <div className="animate-pearl-marquee flex items-center gap-6 group-hover:[animation-play-state:paused] px-4">
            {marqueeItems.map((item, idx) => (
              <div
                key={`${item.id}-${idx}`}
                onClick={() => {
                  onSelectVariety?.(item.id);
                }}
                className="group/card relative w-[280px] sm:w-[320px] shrink-0 rounded-2xl border border-[#E6DDD0] bg-white p-5 transition-all duration-300 hover:border-[#8A6A2F] hover:shadow-lg hover:-translate-y-1.5 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  {/* Top: Foto Thumbnail Mutiara & Grade Badge */}
                  <div className="flex items-center justify-between gap-3 mb-3.5">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-[#E6DDD0] bg-[#12263A] shrink-0 shadow-xs">
                      <img
                        src={resolveMediaUrl(item.image, '/images/hero_pearl_shell.jpg')}
                        alt={`Mutiara ${item.name}`}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover aspect-square group-hover/card:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#EDE6DA] text-[#8A6A2F] border border-[#D9CFBF]">
                        {item.grade}
                      </span>
                      <span className="text-[11px] text-[#4A5666] mt-0.5 font-medium">
                        {item.sizeRange}
                      </span>
                    </div>
                  </div>

                  {/* Variety Title & Scientific Name */}
                  <div className="space-y-1">
                    <h3 className="font-serif text-[20px] font-medium text-[#12263A] group-hover/card:text-[#8A6A2F] transition-colors leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-[11px] italic text-[#8A6A2F] truncate">
                      {item.scientificName}
                    </p>
                  </div>

                  {/* Luster & Origin */}
                  <div className="mt-3 pt-3 border-t border-[#E6DDD0]/70 flex flex-col gap-1 text-[12px]">
                    <div className="flex items-center justify-between">
                      <span className="text-[#4A5666]">Kilau:</span>
                      <span className="font-medium text-[#12263A] truncate max-w-[160px] text-right">
                        {item.luster}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[#4A5666]">Asal:</span>
                      <span className="font-medium text-[#12263A] truncate max-w-[160px] text-right">
                        {item.origin}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer Action Hint */}
                <div className="mt-4 pt-2.5 border-t border-[#E6DDD0]/40 flex items-center justify-between text-[11px] text-[#8A6A2F] font-semibold">
                  <span className="group-hover/card:underline">Lihat Koleksi {item.name}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover/card:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
          </div>

          {/* Marquee Navigation Cue */}
          <div className="mt-4 text-center">
            <span className="text-[11px] text-[#4A5666] tracking-wide inline-flex items-center gap-1.5">
              <span>Arahkan kursor untuk menjeda putaran marquee</span>
              <span className="opacity-40">•</span>
              <span>Klik kartu untuk filter langsung di katalog perhiasan</span>
            </span>
          </div>
        </div>
      ) : (
        /* ========================================================
            MODE 2: TAMPILAN GRID 6-8 KOLOM (Seperti Kode Snippet)
           ======================================================== */
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {pearlVarietiesData.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectVariety?.(item.id);
                }}
                className="group relative overflow-hidden rounded-2xl border border-[#E6DDD0] bg-white p-5 transition-all duration-300 hover:border-[#8A6A2F] hover:shadow-lg hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <div className="w-14 h-14 rounded-xl overflow-hidden border border-[#E6DDD0] bg-[#12263A] shrink-0 shadow-xs">
                      <img
                        src={resolveMediaUrl(item.image, '/images/hero_pearl_shell.jpg')}
                        alt={`Mutiara ${item.name}`}
                        width={56}
                        height={56}
                        className="w-full h-full object-cover aspect-square group-hover:scale-110 transition-transform duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#EDE6DA] text-[#8A6A2F] border border-[#D9CFBF]">
                      {item.grade}
                    </span>
                  </div>

                  <h3 className="font-serif text-[20px] font-semibold text-[#12263A] group-hover:text-[#8A6A2F] transition-colors">
                    {item.name}
                  </h3>
                  <p className="text-[11px] italic text-[#8A6A2F] mb-2">
                    {item.scientificName}
                  </p>
                  <p className="text-[12px] text-[#4A5666] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-[#E6DDD0] flex items-center justify-between text-[11px] text-[#12263A]">
                  <span className="font-medium text-[#4A5666]">{item.sizeRange}</span>
                  <span className="text-[#8A6A2F] font-semibold group-hover:underline inline-flex items-center gap-1">
                    Koleksi <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

