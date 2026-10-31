import React from 'react';
import { Sparkles, Award, ShieldCheck, Boxes, Layers } from 'lucide-react';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (slug: string) => void;
}

export const CategoryNav: React.FC<CategoryNavProps> = ({ selectedCategory, onSelectCategory }) => {
  const categories = [
    { slug: 'all', name: 'Semua Koleksi', icon: Layers },
    { slug: 'kalung', name: 'Kalung Mutiara', icon: Sparkles },
    { slug: 'gelang', name: 'Gelang Mutiara', icon: Award },
    { slug: 'anting', name: 'Anting Mutiara', icon: Sparkles },
    { slug: 'cincin', name: 'Cincin Mutiara', icon: ShieldCheck },
    { slug: 'mutiara-lepas', name: 'Mutiara Lepas', icon: Boxes },
  ];

  return (
    <div className="flex items-center justify-start sm:justify-center gap-2.5 sm:gap-3 overflow-x-auto pb-4 no-scrollbar px-2">
      {categories.map((cat) => {
        const Icon = cat.icon;
        const active = selectedCategory === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => onSelectCategory(cat.slug)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider whitespace-nowrap transition-all duration-300 cursor-pointer ${
              active
                ? 'bg-gradient-to-r from-[#C5A880] to-[#B39368] text-[#120E0C] shadow-[0_2px_18px_rgba(197,168,128,0.35)] border border-[#C5A880] scale-102'
                : 'bg-[#161210] hover:bg-[#221915] text-[#D8CCC4] hover:text-white border border-[#2D231F] hover:border-[#C5A880]/50 backdrop-blur-md shadow-sm'
            }`}
          >
            <Icon size={14} className={active ? 'text-[#120E0C]' : 'text-[#C5A880]'} />
            <span>{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};

