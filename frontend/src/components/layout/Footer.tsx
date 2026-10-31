import React, { useState } from 'react';
import { Send, MapPin, ShieldCheck, MessageCircle, Sparkles } from 'lucide-react';

interface FooterProps {
  onNavigate: (tab: string, categoryFilter?: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="w-full bg-[#0D0B0A] text-[#F5ECE5] pt-20 pb-14 px-6 sm:px-12 border-t border-[#261E1A] relative overflow-hidden">
      {/* Ambient Pearl Glow in Footer */}
      <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full bg-[#C5A880]/5 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Top: Monogram Logo & Newsletter Box */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 pb-12 border-b border-white/10">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <img
              src="/images/cde_logo_clean.png"
              alt="CD'E Pearls South Sea Logo"
              className="h-18 w-auto object-contain drop-shadow-md brightness-110"
            />
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2 text-[11px] font-bold uppercase tracking-widest text-[#BD8F4B] mb-1">
                <Sparkles size={13} />
                <span>Haute Joaillerie Samudera Lombok</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold tracking-wide text-white">
                CD'E Pearls Lombok
              </h3>
              <p className="text-xs text-[#F5ECE5]/70 tracking-widest uppercase mt-1">
                Budidaya Pinctada Maxima Sekotong &amp; Medana, Lombok &amp; Atelier Emas 18K
              </p>
            </div>
          </div>

          {/* Newsletter Box */}
          <div className="w-full md:w-auto">
            <p className="text-xs font-bold uppercase tracking-widest text-amber-200/90 mb-2 text-center md:text-left">
              Lingkaran Eksklusif Kolektor Mutiara
            </p>
            <form onSubmit={handleSubscribe} className="relative flex items-center max-w-md mx-auto">
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Masukkan email untuk warta atelier..."
                className="w-full sm:w-80 h-11 pl-5 pr-12 rounded-full bg-white/10 text-xs text-white placeholder:text-gray-400 border border-white/20 focus:outline-none focus:border-[#BD8F4B] focus:ring-2 focus:ring-[#BD8F4B]/30 backdrop-blur-md transition-all"
                required
              />
              <button
                type="submit"
                className="absolute right-1 top-1 w-9 h-9 rounded-full bg-[#BD8F4B] text-white hover:bg-[#A87834] flex items-center justify-center transition-all cursor-pointer shadow-md"
                title="Langganan Warta"
              >
                <Send size={14} />
              </button>
            </form>
            {subscribed && (
              <p className="text-[11px] text-emerald-400 font-semibold mt-2 text-center md:text-left">
                ✓ Terima kasih telah bergabung dalam lingkaran eksklusif CD'E Pearls.
              </p>
            )}
          </div>
        </div>

        {/* Middle: Horizontal Navigation Links - All Pages Directory */}
        <div className="py-8 border-b border-white/10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-wider text-[#F5ECE5]/80">
          <button onClick={() => onNavigate('home')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            Beranda
          </button>
          <span className="text-white/20">•</span>
          <button onClick={() => onNavigate('catalog')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            Katalog Produk
          </button>
          <span className="text-white/20">•</span>
          <button onClick={() => onNavigate('customizer')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            Studio 3D Atelier
          </button>
          <span className="text-white/20">•</span>
          <button onClick={() => onNavigate('cart')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            Keranjang & Resi
          </button>
          <span className="text-white/20">•</span>
          <button onClick={() => onNavigate('customer')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            Dashboard Pembeli
          </button>
          <span className="text-white/20">•</span>
          <button onClick={() => onNavigate('about')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            Tentang Kami
          </button>
          <span className="text-white/20">•</span>
          <button onClick={() => onNavigate('blog')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            Jurnal Gemologi
          </button>
          <span className="text-white/20">•</span>
          <button onClick={() => onNavigate('faq')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            FAQ
          </button>
          <span className="text-white/20">•</span>
          <button onClick={() => onNavigate('contact')} className="hover:text-[#BD8F4B] transition-colors cursor-pointer">
            Kontak Butik
          </button>
          <span className="text-white/20">•</span>
          <button
            onClick={() => onNavigate('admin')}
            className="text-[#BD8F4B] hover:text-white font-bold transition-colors cursor-pointer bg-white/10 px-3 py-1 rounded-full border border-[#BD8F4B]/30"
          >
            🛡️ SPI (Sistem Pengendali Internal)
          </button>
          <span className="text-white/20">•</span>
          <a
            href="https://wa.me/6281239887766?text=Halo%20Atelier%20CDE%20Pearls%20Lombok"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            <MessageCircle size={14} />
            <span>WhatsApp Butik</span>
          </a>
        </div>

        {/* Bottom: Address, Certification & Copyright */}
        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#F5ECE5]/60 text-center md:text-left">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-[#BD8F4B] shrink-0" />
            <span>Jl. Raya Senggigi No. 88, Batu Layar, Lombok Barat, NTB 83355</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-[#BD8F4B] font-semibold">
              <ShieldCheck size={15} />
              100% Genuine South Sea Pearls
            </span>
            <span>© {new Date().getFullYear()} CD'E Pearls Lombok. All Rights Reserved.</span>
          </div>
        </div>

      </div>
    </footer>
  );
};
