import React from 'react';
import { Award, ShieldCheck, MapPin, MessageCircle, Sparkles, Anchor } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 space-y-16">
      {/* Hero Tentang Kami */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-[0.16em] uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#8A6A2F]" />
            Warisan Samudera Nusa Tenggara Barat
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-medium text-[#12263A] leading-tight">
            Kemewahan Murni dari Kedalaman Samudera Lombok
          </h1>
          <p className="text-[15px] text-[#4A5666] leading-relaxed">
            Berdiri di pesisir murni Sekotong &amp; Medana, Lombok, <strong>CD'E Pearls</strong> mendedikasikan diri untuk melestarikan budidaya mutiara laut selatan (<em>South Sea Pearls</em>) kualitas kolektor secara etis dan ramah lingkungan.
          </p>
          <p className="text-[15px] text-[#4A5666] leading-relaxed">
            Setiap butir mutiara yang meninggalkan atelier kami merupakan mahakarya organik yang dipanen setelah 24–36 bulan pembentukan nacre alami di dalam tiram <em>Pinctada maxima</em>, dirangkai manual dengan emas 18K solid dan perak 925 oleh perajin perhiasan legendaris nusantara.
          </p>

          <div className="pt-2 grid grid-cols-3 gap-4 border-t border-[#E6DDD0]">
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#12263A]">24–36 Bulan</p>
              <p className="text-xs text-[#4A5666]">Masa Tumbuh Alami</p>
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#8A6A2F]">18K &amp; 925</p>
              <p className="text-xs text-[#4A5666]">Solid Gold &amp; Silver</p>
            </div>
            <div>
              <p className="font-serif text-2xl sm:text-3xl font-semibold text-[#12263A]">100%</p>
              <p className="text-xs text-[#4A5666]">Sertifikat lab gemologi</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative w-full h-[360px] sm:h-[440px] rounded-3xl overflow-hidden shadow-2xl border-2 border-[#E6DDD0] group">
            <img
              src="/images/terroir_pearl_plate_left.jpg"
              alt="Atelier CD'E Pearls Sekotong &amp; Medana Lombok"
              width={480}
              height={440}
              className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />
            <div className="absolute top-4 left-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#12263A]/90 text-[#D9B877] border border-[#D9B877]/30 backdrop-blur-md shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-[#D9B877]" />
                Atelier Sekotong &amp; Medana, Lombok
              </span>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-white">
              <p className="text-xs font-medium text-white/90">
                Piring keramik perak &amp; mutiara laut emas Sekotong &amp; Medana yang baru dipanen dari budidaya etis.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nilai-Nilai Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs hover:border-[#8A6A2F]/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0] flex items-center justify-center text-[#8A6A2F] mb-4">
            <Award className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-medium text-[#12263A] mb-2">100% Keaslian Samudera</h3>
          <p className="text-xs text-[#4A5666] leading-relaxed">
            Tanpa pemutih, tanpa pewarna kimiawi (treatment). Kilau emas pekat maupun putih sutra murni 100% hasil biologi tiram Pinctada maxima di perairan kaya mineral NTB.
          </p>
        </div>

        <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs hover:border-[#8A6A2F]/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0] flex items-center justify-center text-[#8A6A2F] mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-medium text-[#12263A] mb-2">Sertifikasi Gemologi Resmi</h3>
          <p className="text-xs text-[#4A5666] leading-relaxed">
            Setiap butir mutiara lolos uji parameter 5 faktor (Luster, Surface, Shape, Color, Nacre Thickness) yang diverifikasi kartu paspor laboratorium gemologi independen.
          </p>
        </div>

        <div className="bg-white border border-[#E6DDD0] rounded-2xl p-6 shadow-xs hover:border-[#8A6A2F]/50 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-[#FBF8F3] border border-[#E6DDD0] flex items-center justify-center text-[#8A6A2F] mb-4">
            <Anchor className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-xl font-medium text-[#12263A] mb-2">Kelestarian Ekosistem Laut</h3>
          <p className="text-xs text-[#4A5666] leading-relaxed">
            Budidaya mutiara laut selatan menjaga kelestarian terumbu karang dan menyokong mata pencaharian komunitas penyelam tradisional di sepanjang pesisir Lombok.
          </p>
        </div>
      </div>

      {/* Galeri Koleksi & Atelier Visual */}
      <div className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#8A6A2F]">
            Sorotan Atelier
          </span>
          <h2 className="font-serif text-3xl font-medium text-[#12263A]">
            Perjalanan dari Samudera Menuju Mahakarya
          </h2>
          <p className="text-xs text-[#4A5666]">
            Dedikasi kami tercermin dalam ketelitian pemilihan setiap milimeter kemilau mutiara dan rancangan perhiasan haute joaillerie.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative h-[280px] rounded-2xl overflow-hidden border border-[#E6DDD0] shadow-sm group">
            <img
              src="/images/hero_pearl_shell.jpg"
              alt="Panen tiram Pinctada maxima Sekotong &amp; Medana"
              width={380}
              height={280}
              className="w-full h-full object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs font-semibold text-[#D9B877] uppercase tracking-wider">Panen Alami</p>
              <p className="text-sm font-medium">Tiram Pinctada Maxima</p>
            </div>
          </div>

          <div className="relative h-[280px] rounded-2xl overflow-hidden border border-[#E6DDD0] shadow-sm group">
            <img
              src="/images/hero_pearl_shell.jpg"
              alt="Rangkaian Cincin Emas 18K"
              width={380}
              height={280}
              className="w-full h-full object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs font-semibold text-[#D9B877] uppercase tracking-wider">Handcrafted Atelier</p>
              <p className="text-sm font-medium">Solitaire Ring Silk Setting</p>
            </div>
          </div>

          <div className="relative h-[280px] rounded-2xl overflow-hidden border border-[#E6DDD0] shadow-sm group">
            <img
              src="/images/featured_pearl_dark_luxury.jpg"
              alt="Koleksi Emas Mutiara Hitam & Emas"
              width={380}
              height={280}
              className="w-full h-full object-cover aspect-[4/3] transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              decoding="async"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <p className="text-xs font-semibold text-[#D9B877] uppercase tracking-wider">Koleksi Eksklusif</p>
              <p className="text-sm font-medium">Golden Pearl Mirror Luster</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alamat & Kontak */}
      <div className="bg-[#12263A] text-white rounded-3xl p-8 lg:p-12 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#D9B877]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <span className="text-[12px] uppercase tracking-[0.16em] font-semibold text-[#D9B877] block mb-1">
            Kunjungan Privat &amp; Konsultasi Kolektor
          </span>
          <h2 className="font-serif text-3xl font-medium text-white">
            Kunjungi Atelier Kami di Lombok
          </h2>
          <p className="text-xs text-white/70 max-w-lg mt-2 leading-relaxed">
            Atelier CD'E Pearls melayani janji temu private concierge untuk melihat koleksi mutiara lepas kelas kolektor dan pemilihan langsung di tepi pantai Sekotong &amp; Medana, Lombok.
          </p>
        </div>

        <a
          href="https://wa.me/6281239001122?text=Halo%20Atelier%20CDE%20Pearls,%20saya%20ingin%20mengatur%20janji%20temu%20private%20concierge"
          target="_blank"
          rel="noreferrer"
          className="relative z-10 min-h-[48px] px-8 rounded-full bg-[#D9B877] text-[#12263A] font-semibold text-xs hover:bg-[#e4ca93] inline-flex items-center gap-2 shrink-0 cursor-pointer shadow-lg active:scale-95 transition-all"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Atur Janji Temu Konsultan</span>
        </a>
      </div>
    </div>
  );
};
