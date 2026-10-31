import React from 'react';

export const AnnouncementBar: React.FC = () => {
  return (
    <aside className="w-full bg-[#120E0C] border-b border-[#261E1A] text-[#C5A880] text-[9px] sm:text-[10px] md:text-[11px] font-medium tracking-widest text-center py-1.5 sm:py-2 px-3 sm:px-4 flex items-center justify-center gap-2 uppercase z-50">
      <span className="truncate">GRATIS ONGKIR & ASURANSI PENUH SE-INDONESIA</span>
      <span className="text-[#C5A880]/50">•</span>
      <span className="hidden sm:inline">KONSULTASI ATELIER VIA WA RESMI</span>
      <span className="hidden sm:inline text-[#C5A880]/50">•</span>
      <span className="hidden xs:inline">SERTIFIKAT LAB GEMOLOGI 100% ASLI</span>
    </aside>
  );
};
