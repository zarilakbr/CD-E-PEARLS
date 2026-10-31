import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

interface DataTableProps {
  children: React.ReactNode;
  className?: string;
  pagination?: React.ReactNode;
  title?: string;
  actionControl?: React.ReactNode;
  showDensityToggle?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  children,
  className = '',
  pagination,
  title,
  actionControl,
  showDensityToggle = true,
}) => {
  const [isCompact, setIsCompact] = useState(false);

  return (
    <div className={`bg-white border border-[#E6DDD0] rounded-2xl overflow-hidden shadow-xs transition-shadow hover:shadow-sm ${className}`}>
      {/* Table Toolbar if title or actions provided */}
      {(title || actionControl || showDensityToggle) && (
        <div className="px-6 py-3.5 border-b border-[#E6DDD0] bg-[#FBF8F3]/50 flex items-center justify-between gap-4">
          {title && (
            <h3 className="font-serif text-base font-semibold text-[#12263A]">
              {title}
            </h3>
          )}

          <div className="flex items-center gap-2.5 ml-auto">
            {actionControl}

            {showDensityToggle && (
              <button
                type="button"
                onClick={() => setIsCompact(!isCompact)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-[#4A5666] border border-[#E6DDD0] hover:bg-white hover:text-[#12263A] transition-colors cursor-pointer"
                title="Alihkan kepadatan tabel (kompak / normal)"
              >
                <SlidersHorizontal className="w-3 h-3 text-[#8A6A2F]" />
                <span className="text-[11px]">{isCompact ? 'Kompak' : 'Nyaman'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sticky Table Body Container */}
      <div className="w-full overflow-x-auto max-h-[640px] custom-scrollbar">
        <table
          className={`w-full text-left border-collapse ${
            isCompact ? 'text-[12px] [&_td]:py-2.5 [&_th]:py-2.5' : 'text-[13px] [&_td]:py-3.5 [&_th]:py-3.5'
          } [&_tr]:transition-colors [&_tbody_tr:hover]:bg-[#FBF8F3]/70 [&_th]:sticky [&_th]:top-0 [&_th]:bg-[#F4F1EB] [&_th]:z-10 [&_th]:font-semibold [&_th]:text-[#12263A] [&_th]:border-b [&_th]:border-[#E6DDD0] [&_td]:border-b [&_td]:border-[#F4F1EB]`}
        >
          {children}
        </table>
      </div>

      {pagination && (
        <div className="border-t border-[#E6DDD0] px-6 py-3.5 bg-[#FBF8F3]/60 flex items-center justify-between text-xs text-[#4A5666]">
          {pagination}
        </div>
      )}
    </div>
  );
};
