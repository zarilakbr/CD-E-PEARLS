import React from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface FilterBarProps {
  variety: string;
  grade: string;
  sort: string;
  onVarietyChange: (val: string) => void;
  onGradeChange: (val: string) => void;
  onSortChange: (val: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  variety,
  grade,
  sort,
  onVarietyChange,
  onGradeChange,
  onSortChange,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-[#161210] border border-[#2D231F] shadow-[0_4px_25px_rgba(0,0,0,0.4)] mb-6 sm:mb-8 text-xs text-[#E0D5CE]">
      <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[#C5A880]">
        <SlidersHorizontal size={15} />
        <span>Filter Koleksi:</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 md:flex md:flex-wrap items-center gap-2.5 sm:gap-3 w-full md:w-auto">
        {/* Variety Filter */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto">
          <span className="text-[#A39288] font-medium shrink-0">Varietas:</span>
          <select
            value={variety}
            onChange={(e) => onVarietyChange(e.target.value)}
            className="flex-1 sm:flex-initial h-9 px-3 rounded-full bg-[#221915] text-[#F5ECE5] font-semibold border border-[#382B24] focus:border-[#C5A880] outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#161210] text-[#F5ECE5]">Semua Varietas</option>
            <option value="Gold" className="bg-[#161210] text-[#F5ECE5]">Golden South Sea</option>
            <option value="White" className="bg-[#161210] text-[#F5ECE5]">White South Sea</option>
            <option value="Champagne" className="bg-[#161210] text-[#F5ECE5]">Champagne Gold</option>
            <option value="Silver" className="bg-[#161210] text-[#F5ECE5]">Silvery Mist</option>
          </select>
        </div>

        {/* Grade Filter */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto">
          <span className="text-[#A39288] font-medium shrink-0">Grade:</span>
          <select
            value={grade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="flex-1 sm:flex-initial h-9 px-3 rounded-full bg-[#221915] text-[#F5ECE5] font-semibold border border-[#382B24] focus:border-[#C5A880] outline-none cursor-pointer"
          >
            <option value="all" className="bg-[#161210] text-[#F5ECE5]">Semua Mutu</option>
            <option value="Grade AAA" className="bg-[#161210] text-[#F5ECE5]">Grade AAA (Flawless)</option>
            <option value="Grade AA+" className="bg-[#161210] text-[#F5ECE5]">Grade AA+</option>
            <option value="Baroque" className="bg-[#161210] text-[#F5ECE5]">Baroque Alami</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center justify-between sm:justify-start gap-1.5 w-full sm:w-auto">
          <span className="text-[#A39288] font-medium shrink-0">Urutkan:</span>
          <select
            value={sort}
            onChange={(e) => onSortChange(e.target.value)}
            className="flex-1 sm:flex-initial h-9 px-3 rounded-full bg-[#221915] text-[#F5ECE5] font-semibold border border-[#382B24] focus:border-[#C5A880] outline-none cursor-pointer"
          >
            <option value="popular" className="bg-[#161210] text-[#F5ECE5]">Terpopuler</option>
            <option value="price_desc" className="bg-[#161210] text-[#F5ECE5]">Harga Tertinggi</option>
            <option value="price_asc" className="bg-[#161210] text-[#F5ECE5]">Harga Terendah</option>
            <option value="rating" className="bg-[#161210] text-[#F5ECE5]">Rating Tertinggi</option>
            <option value="newest" className="bg-[#161210] text-[#F5ECE5]">Terbaru</option>
          </select>
        </div>
      </div>
    </div>
  );
};

