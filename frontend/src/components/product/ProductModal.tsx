import React, { useState } from 'react';
import { ShoppingBag, MessageCircle, ShieldCheck, Check, Sparkles, MapPin, Scale } from 'lucide-react';
import type { Product } from '../../types';
import { Dialog } from '../ui/dialog';
import { useCart } from '../../context/CartContext';
import { recordWhatsAppLead } from '../../services/api';
import { resolveMediaUrl, resolveWebpUrl } from '../../lib/media';

interface ProductModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({ product, open, onOpenChange }) => {
  const { addToCart } = useCart();
  const [addedToast, setAddedToast] = useState(false);

  if (!product) return null;

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(num);
  };

  const handleAddToCart = () => {
    addToCart(product, 1);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyWhatsApp = () => {
    recordWhatsAppLead({
      customer_name: 'Calon Pembeli (Web Direct Checkout)',
      phone: 'WhatsApp User',
      source: 'ORDER_CHECKOUT',
      product_id: product.id,
      message: `Pemesanan langsung: ${product.name} (${formatIDR(product.price)})`,
    }).catch(() => {});

    const msg = `Halo Atelier CD'E Pearls Lombok,%0A%0ASaya ingin memesan perhiasan:%0A*${encodeURIComponent(product.name)}*%0AKode: ${product.code || product.id}%0AHarga: ${formatIDR(product.price)}%0ASertifikat: ${product.certificate || 'CDE-CERT'}%0A%0AMohon panduan nomor rekening resmi butik untuk pembayaran. Terima kasih.`;
    window.open(`https://wa.me/6281239887766?text=${msg}`, '_blank');
  };

  const handleConsultWhatsApp = () => {
    recordWhatsAppLead({
      customer_name: 'Calon Pembeli (Web Consultation)',
      phone: 'WhatsApp User',
      source: 'PRODUCT_CONSULTATION',
      product_id: product.id,
      message: `Konsultasi produk: ${product.name}`,
    }).catch(() => {});

    const msg = `Halo Gemologist CD'E Pearls Lombok,%0A%0ASaya ingin berkonsultasi mengenai perhiasan:%0A*${encodeURIComponent(product.name)}*%0A(Grade: ${product.pearl_grade || 'AAA'}, Ukuran: ${product.pearl_size || '-'})%0A%0AApakah stok masih tersedia dan bisa disesuaikan dengan ukuran saya?`;
    window.open(`https://wa.me/6281239887766?text=${msg}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-2 text-[#F5ECE5] max-h-[80vh] overflow-y-auto pr-1">
        {/* Left: Product Media & Certificate */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-square w-full rounded-[20px] overflow-hidden bg-[#0D0B0A] border border-[#2D231F]">
            <picture className="w-full h-full">
              <source srcSet={resolveWebpUrl(product.webp_url || product.image)} type="image/webp" />
              <img
                src={resolveMediaUrl(product.image, '/images/placeholder_jewelry.svg')}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/images/placeholder_jewelry.svg';
                }}
              />
            </picture>
            {Boolean(product.discount_percent && product.discount_percent > 0) && (
              <span className="absolute top-4 left-4 rounded-full bg-[#BA4E4E] text-white text-[11px] font-bold px-3 py-1 shadow-md">
                HEMAT {product.discount_percent}%
              </span>
            )}
          </div>

          {/* Certificate Badge */}
          <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/5 border border-[#C5A880]/30 text-xs text-[#F5ECE5]">
            <ShieldCheck size={22} className="text-[#C5A880] shrink-0" />
            <div>
              <span className="font-bold text-white block">Sertifikat Gemologi Resmi</span>
              <span className="text-[11px] text-[#A39288]">No. Registrasi: {product.certificate || 'CDE-CERT-8894'}</span>
            </div>
          </div>
        </div>

        {/* Right: Specifications & 3 Action Buttons */}
        <div className="flex flex-col justify-between">
          <div>
            {/* Variety & Grade Pill */}
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-0.5 rounded-full bg-[#C5A880]/15 text-[#C5A880] text-xs font-bold uppercase tracking-wider">
                {product.pearl_grade || 'Grade AAA'}
              </span>
              <span className="text-xs text-[#A39288]">{product.pearl_type}</span>
            </div>

            {/* Title */}
            <h2 className="font-serif text-2xl font-bold text-white leading-tight mb-3">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-3 pb-4 mb-4 border-b border-[#2D231F]">
              <span className="font-sans text-2xl font-bold text-[#C5A880]">
                {formatIDR(product.price)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-sm text-white/40 line-through">
                  {formatIDR(product.original_price)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs text-[#D4C4B8] leading-relaxed mb-4 font-light">
              {product.description || 'Mahakarya perhiasan mutiara air laut selatan alami asli perairan Lombok dengan pantulan cermin tebal dan balutan logam mulia 18K solid.'}
            </p>

            {/* Specs Grid */}
            <div className="grid grid-cols-2 gap-2 text-xs mb-6 bg-white/5 p-3.5 rounded-2xl border border-[#2D231F]">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-[#C5A880]" />
                <span className="text-[#A39288]">Ukuran:</span>
                <span className="font-bold text-white">{product.pearl_size || '10-11 mm'}</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-[#C5A880]" />
                <span className="text-[#A39288]">Rangka:</span>
                <span className="font-bold text-white">{product.metal || 'Emas 18K'}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-[#C5A880]" />
                <span className="text-[#A39288]">Asal:</span>
                <span className="font-bold text-white truncate">{product.origin || 'Lombok, NTB'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Scale size={14} className="text-[#C5A880]" />
                <span className="text-[#A39288]">Stok:</span>
                <span className={`font-bold ${product.stock <= 3 ? 'text-[#BA4E4E]' : 'text-emerald-400'}`}>
                  {product.stock} Butir Tersedia
                </span>
              </div>
            </div>
          </div>

          {/* 3 Action Buttons */}
          <div className="flex flex-col gap-2.5 pt-2">
            {/* 1. Add to Cart */}
            <button
              onClick={handleAddToCart}
              className="w-full h-11 rounded-full bg-gradient-to-r from-[#C5A880] to-[#B39368] hover:from-[#B39368] hover:to-[#A18055] text-[#120E0C] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_2px_15px_rgba(197,168,128,0.25)] transition-all cursor-pointer"
            >
              {addedToast ? <Check size={16} /> : <ShoppingBag size={16} />}
              <span>{addedToast ? 'BERHASIL DITAMBAHKAN!' : '+ KERANJANG BELANJA'}</span>
            </button>

            {/* 2 & 3: WhatsApp Actions */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={handleBuyWhatsApp}
                className="h-11 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>BELI VIA WA</span>
              </button>

              <button
                onClick={handleConsultWhatsApp}
                className="h-11 rounded-full border border-white/20 hover:border-[#C5A880] bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>KONSULTASI</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
