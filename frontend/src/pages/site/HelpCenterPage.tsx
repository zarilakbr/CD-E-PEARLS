import React, { useEffect, useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

export const HelpCenterPage: React.FC = () => {
  useEffect(() => {
    document.title = "Pusat Bantuan & FAQ | CD'E Pearls Lombok";
  }, []);

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Bagaimana cara memastikan keaslian mutiara laut selatan CD\'E Pearls?',
      a: 'Setiap butir mutiara dilengkapi sertifikat uji laboratorium gemologi resmi dengan nomor seri unik. Anda dapat memasukkan nomor sertifikat pada menu "Cek Sertifikat" di website ini untuk memvalidasi spesifikasi fisik dan hasil uji laboratoriumnya.',
    },
    {
      q: 'Berapa lama masa tumbuh tiram mutiara di budidaya Sekotong & Medana?',
      a: 'Tiram Pinctada maxima kami dibudidayakan di perairan alami Sekotong dan Medana, Lombok Barat/Utara dengan masa pembentukan nacre 24 hingga 36 bulan guna menghasilkan kilau (luster) dan ketebalan lapisan yang optimal.',
    },
    {
      q: 'Apakah pengiriman perhiasan aman dan berasuransi?',
      a: 'Ya, seluruh pengiriman paket perhiasan menggunakan ekspedisi khusus bernilai tinggi dengan asuransi penuh 100% dari nilai perhiasan serta dikemas dalam kotak velvet mewah bersegel keamanan.',
    },
    {
      q: 'Metode pembayaran apa saja yang diterima?',
      a: 'Kami menerima pembayaran melalui transfer bank resmi (BCA, Mandiri, BNI) serta konfirmasi pembayaran otomatis atau manual yang diverifikasi oleh sistem keuangan dan SPI.',
    },
    {
      q: 'Bagaimana cara merawat perhiasan mutiara agar kilaunya abadi?',
      a: 'Simpan mutiara secara terpisah dari logam keras lainnya. Hindari kontak langsung dengan parfum, hairspray, dan zat kimia. Bersihkan lembut dengan kain mikrofiber lembap setelah pemakaian.',
    },
  ];

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-wider uppercase">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Panduan &amp; Layanan Pelanggan</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          Pusat Bantuan &amp; FAQ
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] font-light max-w-xl mx-auto">
          Temukan jawaban atas pertanyaan umum seputar koleksi, sertifikasi keaslian, pengiriman, dan panduan perawatan mutiara laut selatan Lombok.
        </p>
      </div>

      {/* Accordion FAQ */}
      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-2xl overflow-hidden shadow-xs transition-all"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-serif text-base sm:text-lg font-semibold text-[#12263A] dark:text-[#FBF8F3]">
                  {faq.q}
                </span>
                {isOpen ? (
                  <ChevronUp className="w-4 h-4 text-[#8A6A2F] shrink-0" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-[#4A5666] shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] leading-relaxed border-t border-[#E6DDD0]/60 dark:border-white/5 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Contact Support Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#12263A] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="font-serif text-xl font-bold text-[#D9B877]">
            Memerlukan Konsultasi Khusus?
          </h3>
          <p className="text-xs text-white/80 font-light">
            Gemolog kami siap membantu Anda memilih perhiasan mutiara terbaik secara pribadi.
          </p>
        </div>
        <a
          href="https://wa.me/6281239887766?text=Halo%20Atelier%20CD'E%20Pearls,%20saya%20ingin%20berkonsultasi"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#D9B877] text-[#12263A] hover:bg-[#E5C98F] text-xs font-semibold cursor-pointer shadow-md shrink-0"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Hubungi via WhatsApp</span>
        </a>
      </div>
    </div>
  );
};

export default HelpCenterPage;
