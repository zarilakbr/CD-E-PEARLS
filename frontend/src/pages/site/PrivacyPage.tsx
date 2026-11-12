import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Seo } from '../../components/common/Seo';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-10">
      <Seo
        title="Kebijakan Privasi Pelanggan | CD'E Pearls Lombok"
        description="Kebijakan perlindungan data pribadi pelanggan, kolektor, dan keamanan transaksi resmi di butik perhiasan CD'E Pearls Lombok."
        path="/kebijakan-privasi"
      />
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-wider uppercase">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Perlindungan Data Pribadi</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          Kebijakan Privasi
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] font-light">
          Komitmen Keamanan Data Kolektor • CD'E Pearls Lombok
        </p>
      </div>

      <div className="bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] leading-relaxed">
        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            1. Data yang Kami Kumpulkan
          </h2>
          <p>
            CD'E Pearls hanya mengumpulkan informasi yang diperlukan untuk pemrosesan pesanan perhiasan dan korespondensi atelier, meliputi nama lengkap, alamat penyerahan paket, alamat email, dan nomor kontak WhatsApp/telepon. Kami tidak menyimpan informasi kartu kredit atau kredensial perbankan pelanggan.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            2. Keamanan dan Enkripsi Data
          </h2>
          <p>
            Seluruh data akun dan transaksi dilindungi enkripsi standar industri (TLS/HTTPS). Akses ke arsip audit internal dikontrol secara ketat oleh Satuan Pengawas Internal (SPI) guna memastikan tidak terjadi penyalahgunaan data kolektor.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            3. Penggunaan Cookies dan Cloudflare Turnstile
          </h2>
          <p>
            Kami menggunakan teknologi cookie sesi semata-mata untuk menjaga keamanan status login Anda dan widget Cloudflare Turnstile untuk mencegah serangan bot terdistribusi (DDoS) tanpa melakukan pelacakan perilaku lintas situs.
          </p>
        </section>

        <section className="space-y-2">
          <h2 className="font-serif text-xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            4. Hak Akses dan Penghapusan Data
          </h2>
          <p>
            Anda memiliki hak untuk meminta salinan data akun Anda atau mengajukan penutupan akun permanen dengan menghubungi layanan pelanggan resmi atelier CD'E Pearls Lombok.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
