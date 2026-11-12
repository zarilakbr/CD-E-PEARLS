import React from 'react';
import { ArrowRight, Sparkles, CheckCircle2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Seo } from '../../components/common/Seo';

interface EducationPageProps {
  onNavigateCatalog?: () => void;
}

export const EducationPage: React.FC<EducationPageProps> = ({ onNavigateCatalog }) => {
  const navigate = useNavigate();
  const handleNavCatalog = () => {
    if (onNavigateCatalog) onNavigateCatalog();
    else navigate('/katalog');
  };
  const pillars = [
    {
      title: '1. Kilau (Mirror Luster)',
      badge: 'Grade AAA',
      image: '/images/featured_pearl_dark_luxury.jpg',
      desc: 'Kilau adalah jiwa mutiara. Grade AAA memantulkan cahaya cermin yang tajam dan kontras tinggi. Sumber kilau ini berasal dari susunan kalsium karbonat aragonit mikroskopis yang sangat padat.',
    },
    {
      title: '2. Ketebalan Nacre Alami',
      badge: '1.5 - 3.0 mm',
      image: '/images/hero_pearl_shell.jpg',
      desc: 'Nacre merupakan lapisan pembungkus mutiara. Mutiara laut Lombok kami memiliki ketebalan nacre superior 1.5 - 3.0 mm, menjadikannya awet diwariskan antar generasi tanpa risiko terkelupas.',
    },
    {
      title: '3. Bentuk Sempurna (Shape)',
      badge: 'Round & Drop',
      image: '/images/hero_pearl_shell.jpg',
      desc: 'Bentuk bulat simetris sempurna (Round) adalah yang paling langka dan bernilai tinggi. CD\'E Pearls juga menyediakan Drop (tetes air) simetris dan Baroque berkarakter artistik tinggi.',
    },
    {
      title: '4. Kebersihan Permukaan',
      badge: 'Flawless <2%',
      image: '/images/terroir_pearl_plate_left.jpg',
      desc: 'Toleransi noda alami pada grade AAA kurang dari 2%. Sedikit tanda pertumbuhan alami membuktikan keaslian proses organik laut samudera tanpa polesan kimiawi sintetis.',
    },
    {
      title: '5. Ukuran Diameter (Size)',
      badge: '9 mm - 16 mm',
      image: '/images/hero_pearl_dark_luxury.jpg',
      desc: 'Mutiara air laut selatan berdiameter antara 9 mm hingga 16 mm. Butiran berukuran 13 mm ke atas memerlukan waktu tiram hidup 24–36 bulan di perairan dalam Sekotong & Medana, Lombok.',
    },
    {
      title: '6. Warna Samudera Alami',
      badge: '100% Untreated',
      image: '/images/hero_pearl_shell.jpg',
      desc: 'Tersedia dalam 3 varietas murni: Pure White & Silver (Lombok), Natural Deep Champagne Gold (Lombok Imperial), dan Peacock Tahitian Black.',
    },
  ];

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
      <Seo
        title="Edukasi & Gradasi Mutiara Lombok | CD'E Pearls"
        description="Pelajari 6 pilar kualitas mutiara laut selatan asli Lombok: kilau cermin, ketebalan nacre alami, bentuk, kebersihan permukaan, diameter, dan warna."
        path="/edukasi"
      />
      {/* Header with Visual Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-[0.16em] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#8A6A2F]" />
            Panduan Kurasi Mutiara Alami
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-[#12263A] leading-tight">
            Edukasi Mutiara Laut Selatan (South Sea Pearls)
          </h1>
          <p className="text-[16px] text-[#4A5666] leading-relaxed">
            Mutiara air laut selatan dari tiram <em>Pinctada maxima</em> dinobatkan sebagai ratu mutiara dunia. Dihasilkan di perairan murni Sekotong &amp; Medana, Lombok dengan waktu budidaya alami 24–36 bulan tanpa rekayasa pewarna buatan.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#12263A]">
              <CheckCircle2 className="w-4 h-4 text-[#8A6A2F]" />
              <span>Pinctada Maxima Liar &amp; Budidaya</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#12263A]">
              <ShieldCheck className="w-4 h-4 text-[#8A6A2F]" />
              <span>Sertifikat lab gemologi</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative h-[320px] rounded-3xl overflow-hidden border-2 border-[#E6DDD0] shadow-xl group">
            <img
              src="/images/hero_pearl_dark_luxury.jpg"
              alt="Kalung Mutiara Laut Selatan Mewah Sekotong &amp; Medana"
              width={480}
              height={320}
              className="w-full h-full object-cover aspect-[3/2] transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3 rounded-xl border border-white/10 text-white">
              <p className="text-xs font-semibold text-[#D9B877]">Grade AAA Graduated Strand</p>
              <p className="text-[11px] text-white/80">Kombinasi nacre 2.8 mm dengan mirror luster sempurna.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Faktor Kualitas Mutiara (The 5 Virtues of Pearls) */}
      <div className="space-y-8">
        <div className="border-b border-[#E6DDD0] pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
              Standar Gemologi Internasional
            </span>
            <h2 className="font-serif text-3xl font-semibold text-[#12263A]">
              5 Pilar Penilaian Kualitas Mutiara
            </h2>
          </div>
          <p className="text-xs text-[#4A5666] max-w-sm">
            Setiap perhiasan di CD'E Pearls diuji secara ketat berdasarkan 5 parameter ilmiah sebelum dirangkai.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pillars.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-[#E6DDD0] rounded-2xl overflow-hidden shadow-xs hover:border-[#8A6A2F]/50 transition-all group flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden bg-[#12263A]">
                  <img
                    src={item.image}
                    alt={item.title}
                    width={360}
                    height={176}
                    className="w-full h-full object-cover aspect-[16/9] transition-transform duration-500 ease-out group-hover:scale-105"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#12263A]/85 text-[#D9B877] border border-[#D9B877]/30 backdrop-blur-md">
                    {item.badge}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="font-serif text-xl font-medium text-[#12263A] mb-2">{item.title}</h3>
                  <p className="text-xs text-[#4A5666] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Kiat Perawatan */}
      <div className="bg-[#F4F1EB] border border-[#E6DDD0] rounded-3xl p-8 lg:p-10 space-y-6">
        <div className="max-w-xl">
          <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
            Preservasi Kemilau
          </span>
          <h2 className="font-serif text-3xl font-medium text-[#12263A] mt-1">
            Panduan Perawatan Perhiasan Mutiara
          </h2>
          <p className="text-xs text-[#4A5666] mt-2 leading-relaxed">
            Mutiara adalah permata organik hidup. Ikuti kaidah perhiasan warisan agar kilaunya abadi puluhan tahun.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-[#4A5666] leading-relaxed">
          <div className="p-5 bg-white rounded-2xl border border-[#E6DDD0] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FBF8F3] border border-[#E6DDD0] flex items-center justify-center text-[#8A6A2F] font-semibold text-xs mb-3">
              01
            </div>
            <h4 className="font-semibold text-sm text-[#12263A] mb-1">Terakhir Dipakai (Last On)</h4>
            <p>Kenakan mutiara Anda setelah make-up, parfum, hairspray, dan losion tubuh menyerap sepenuhnya untuk melindungi lapisan nacre.</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#E6DDD0] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FBF8F3] border border-[#E6DDD0] flex items-center justify-center text-[#8A6A2F] font-semibold text-xs mb-3">
              02
            </div>
            <h4 className="font-semibold text-sm text-[#12263A] mb-1">Pertama Dilepas (First Off)</h4>
            <p>Lepas mutiara sebelum berenang di kolam berklorin, mandi air panas, atau sauna agar kelembapan nacre tetap terjaga alami.</p>
          </div>

          <div className="p-5 bg-white rounded-2xl border border-[#E6DDD0] shadow-xs">
            <div className="w-8 h-8 rounded-lg bg-[#FBF8F3] border border-[#E6DDD0] flex items-center justify-center text-[#8A6A2F] font-semibold text-xs mb-3">
              03
            </div>
            <h4 className="font-semibold text-sm text-[#12263A] mb-1">Simpan di Kotak Beludru</h4>
            <p>Simpan tersendiri di dalam kantung sutra atau kotak beludru lembut CD'E Pearls agar tidak tergores oleh berlian atau logam tajam.</p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="text-center pt-4">
        <button
          type="button"
          onClick={handleNavCatalog}
          className="min-h-[48px] px-8 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-sm font-semibold inline-flex items-center gap-2 shadow-md cursor-pointer"
        >
          <span>Jelajahi Koleksi Mutiara Bersertifikat</span>
          <ArrowRight className="w-4 h-4 text-[#D9B877]" />
        </button>
      </div>
    </div>
  );
};
