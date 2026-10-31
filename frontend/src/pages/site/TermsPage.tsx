import React, { useEffect } from 'react';
import { Scale } from 'lucide-react';

export const TermsPage: React.FC = () => {
  useEffect(() => {
    document.title = "Syarat & Ketentuan Layanan | CD'E Pearls Lombok";
  }, []);

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-wider uppercase">
          <Scale className="w-3.5 h-3.5" />
          <span>Ketentuan Resmi Butik</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          Syarat &amp; Ketentuan Layanan
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] font-light">
          Berlaku sejak 1 Januari 2026 • CD'E Pearls Lombok Atelier
        </p>
      </div>

      <div className="bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            1. Keaslian dan Sertifikasi Gemologi
          </h2>
          <p>
            Seluruh mutiara yang ditawarkan oleh CD'E Pearls merupakan hasil budidaya mutiara air laut alami (<em>South Sea Pearls - Pinctada Maxima</em>) di perairan Sekotong dan Medana, Lombok, dengan masa pembentukan nacre selama 24–36 bulan. Setiap pembelian disertai sertifikat keaslian gemologi resmi yang terdaftar dalam arsip pengawasan internal (SPI).
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            2. Pemesanan dan Transaksi Pembayaran
          </h2>
          <p>
            Pesanan dianggap sah setelah bukti pembayaran transfer bank diverifikasi oleh sistem administrasi dan SPI. CD'E Pearls berhak membatalkan pesanan apabila bukti pembayaran tidak dapat diverifikasi dalam waktu 24 jam sejak pembuatan pesanan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            3. Pengiriman Berasuransi Penuh
          </h2>
          <p>
            Setiap pengiriman perhiasan dilakukan melalui kurir rekanan khusus bernilai tinggi dengan proteksi asuransi pengiriman 100%. Pembeli diwajibkan membuat rekaman video utuh saat membuka kemasan paket pertama kali (<em>unboxing</em>) tanpa terputus untuk keperluan klaim proteksi jika terjadi kerusakan selama perjalanan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            4. Kebijakan Retur dan Garansi Atelier
          </h2>
          <p>
            Kami memberikan garansi keaslian seumur hidup atas bahan mutiara alami dan kemurnian logam emas 18K/perak 925. Retur barang hanya dapat diproses apabila terdapat ketidaksesuaian spesifikasi fisik dengan sertifikat gemologi yang disertakan.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
