import React, { useEffect } from 'react';
import { MapPin, Phone, Mail, Clock, Send, Sparkles } from 'lucide-react';

export const ContactPage: React.FC = () => {
  useEffect(() => {
    document.title = "Kontak Butik | CD'E Pearls Lombok";
  }, []);

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A6A2F]/10 border border-[#8A6A2F]/20 text-[#8A6A2F] text-[12px] font-semibold tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Atelier &amp; Butik Lombok</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
          Kontak Butik CD'E Pearls
        </h1>
        <p className="text-xs sm:text-sm text-[#4A5666] dark:text-[#D9B877] font-light leading-relaxed">
          Kunjungi galeri kami di Lombok atau hubungi kurator perhiasan kami untuk konsultasi perhiasan eksklusif dan janji temu privat.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Info Cards */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 shadow-xs space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A6A2F]/10 text-[#8A6A2F] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#12263A] dark:text-[#FBF8F3]">
                  Lokasi Butik Utama
                </h4>
                <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-1 leading-relaxed">
                  Jl. Raya Senggigi No. 88, Batu Layar, Kabupaten Lombok Barat, Nusa Tenggara Barat 83355
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A6A2F]/10 text-[#8A6A2F] flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#12263A] dark:text-[#FBF8F3]">
                  Jam Operasional Galeri
                </h4>
                <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-1 leading-relaxed">
                  Senin – Sabtu: 09.00 – 18.00 WITA<br />
                  Minggu &amp; Hari Libur: Dengan Reservasi Khusus
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A6A2F]/10 text-[#8A6A2F] flex items-center justify-center shrink-0 mt-0.5">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#12263A] dark:text-[#FBF8F3]">
                  Telepon &amp; WhatsApp
                </h4>
                <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-1">
                  +62 812-3988-7766 (Concierge Layanan)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#8A6A2F]/10 text-[#8A6A2F] flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#12263A] dark:text-[#FBF8F3]">
                  Surat Elektronik
                </h4>
                <p className="text-xs text-[#4A5666] dark:text-[#D9B877] mt-1">
                  atelier@cdepearls.com
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7 bg-white dark:bg-[#12263A] border border-[#E6DDD0] dark:border-white/10 rounded-3xl p-6 sm:p-10 shadow-xs space-y-5">
          <h3 className="font-serif text-2xl font-bold text-[#12263A] dark:text-[#FBF8F3]">
            Kirim Pesan ke Konsultan Atelier
          </h3>
          <p className="text-xs text-[#4A5666] dark:text-[#D9B877] leading-relaxed">
            Silakan tinggalkan pesan untuk permintaan rancang kustom (bespoke) atau pertanyaan mengenai koleksi.
          </p>

          <form onSubmit={(e) => { e.preventDefault(); alert('Pesan Anda telah dikirimkan ke concierge atelier CD\'E Pearls.'); }} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Nama Anda"
                  className="w-full min-h-[44px] px-3.5 text-xs rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]">Nomor WhatsApp</label>
                <input
                  type="tel"
                  required
                  placeholder="0812..."
                  className="w-full min-h-[44px] px-3.5 text-xs rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#12263A] dark:text-[#FBF8F3]">Pesan Anda</label>
              <textarea
                rows={4}
                required
                placeholder="Tuliskan perhiasan yang diminati atau rencana kunjungan..."
                className="w-full p-3.5 text-xs rounded-xl border border-[#E6DDD0] dark:border-white/10 bg-white dark:bg-[#12263A] focus:outline-hidden focus:ring-2 focus:ring-[#8A6A2F]"
              />
            </div>

            <button
              type="submit"
              className="min-h-[44px] px-6 rounded-full bg-[#12263A] text-white hover:bg-[#1A3652] active:scale-95 transition-all text-xs font-semibold inline-flex items-center gap-2 cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4 text-[#D9B877]" />
              <span>Kirimkan Pesan</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
